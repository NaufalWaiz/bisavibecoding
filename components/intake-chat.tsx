"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/ui/copy-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StreamMarkdown } from "@/components/stream-markdown";
import { splitStreamError } from "@/lib/ai/stream-error";
import { cn } from "@/lib/utils";
import type { ConversationTurn } from "@/lib/db/schema";
import {
  resetConversationAction,
  saveConversationAction,
} from "@/app/(app)/projects/[id]/intake-actions";
import {
  ArrowRight,
  Check,
  Clock,
  Database,
  Layers,
  Lightbulb,
  MessagesSquare,
  PenTool,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  User,
  Zap,
} from "lucide-react";

type Props = {
  projectId: string;
  projectName?: string;
  projectDescription?: string;
  initialConversation: ConversationTurn[];
};

const STARTERS = [
  {
    category: "SaaS",
    prompts: [
      "Saya mau buat SaaS invoicing untuk freelancer dengan PDF generator & tagihan otomatis.",
      "Saya mau buat SaaS analytics sederhana untuk memantau performa landing page.",
    ],
  },
  {
    category: "Aplikasi AI",
    prompts: [
      "Saya mau buat habit tracker dengan AI coach yang memberi rekomendasi harian.",
      "Saya mau buat catatan markdown dengan pencarian semantik untuk bahan kuliah.",
    ],
  },
  {
    category: "Developer tool",
    prompts: [
      "Saya mau buat CLI yang mengubah schema SQL jadi definisi Drizzle ORM.",
    ],
  },
];

export function IntakeChat({
  projectId,
  projectName,
  projectDescription,
  initialConversation,
}: Props) {
  const [turns, setTurns] = useState<ConversationTurn[]>(initialConversation);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isPending, startTransition] = useTransition();

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const answered = turns.filter((turn) => turn.role === "user").length;
  const clarified = turns.filter((turn) => turn.role === "assistant").length;
  const readyForPrd = clarified > 0;

  // Gulirkan panel percakapannya, bukan halamannya: header project dan navigasi
  // pipeline harus tetap di tempat saat balasan mengalir masuk.
  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [turns, streaming]);

  // Textarea tumbuh mengikuti isi sampai batas, lalu menggulir sendiri.
  useEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 200)}px`;
  }, [input]);

  function useStarter(prompt: string) {
    setInput(prompt);
    textareaRef.current?.focus();
  }

  async function send(customInput?: string) {
    const idea = (customInput ?? input).trim();
    if (idea.length < 10) {
      toast.error("Ceritakan idenya sedikit lebih panjang (min. 10 karakter).");
      return;
    }

    const history = turns;
    const withUser: ConversationTurn[] = [...history, { role: "user", content: idea }];
    setTurns(withUser);
    setInput("");
    setBusy(true);
    setStreaming("");

    try {
      const response = await fetch("/api/ai/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, idea }),
      });

      if (!response.ok || !response.body) {
        const detail = await response
          .json()
          .then((data: { error?: string }) => data.error)
          .catch(() => null);
        throw new Error(detail ?? "Gagal menghubungi bisavibecoding.");
      }

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let raw = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        raw += value;
        setStreaming(splitStreamError(raw).content);
      }

      const { content: answer, error: streamError } = splitStreamError(raw);
      if (streamError) throw new Error(streamError);

      const finalTurns: ConversationTurn[] = [
        ...withUser,
        { role: "assistant", content: answer },
      ];
      setTurns(finalTurns);
      setStreaming(null);

      startTransition(async () => {
        const result = await saveConversationAction(projectId, finalTurns);
        if (result.error) toast.error(result.error);
      });
    } catch (error) {
      setStreaming(null);
      setTurns(history);
      setInput(idea);
      toast.error(
        error instanceof Error ? error.message : "Gagal menghubungi bisavibecoding.",
      );
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    startTransition(async () => {
      const result = await resetConversationAction(projectId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setTurns([]);
      setStreaming(null);
      toast.success("Percakapan direset.");
    });
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      {/* ------------------------------------------------------ Panel chat */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-warm-xs">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-surface-sunken/40 px-4 py-2.5">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-tiny font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MessagesSquare className="size-3.5 shrink-0 text-brand-strong" />
              Percakapan intake
            </span>
            {turns.length > 0 ? (
              <span className="rounded-full border border-border bg-card px-2 py-0.5 font-mono text-[10px] font-normal">
                {answered} jawaban · {clarified} balasan
              </span>
            ) : null}
          </div>

          {turns.length > 0 ? (
            <ConfirmDialog
              tone="danger"
              title="Reset percakapan intake?"
              description="Seluruh riwayat percakapan di project ini dihapus. PRD yang sudah dibuat tidak ikut terhapus, tapi bahan mentahnya hilang."
              confirmLabel="Reset percakapan"
              onConfirm={reset}
              trigger={
                <Button
                  variant="ghost"
                  size="xs"
                  disabled={busy || isPending}
                  className="gap-1.5 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                >
                  <RotateCcw className="size-3" />
                  Reset
                </Button>
              }
            />
          ) : null}
        </div>

        <div
          ref={scrollRef}
          className="pane-scroll flex max-h-[62vh] min-h-75 flex-col gap-5 overflow-y-auto p-4 sm:p-5"
        >
          {turns.length === 0 && streaming === null ? (
            <div className="space-y-4">
              {projectDescription ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-brand-soft-border bg-gradient-to-r from-brand-soft/70 via-brand-soft/30 to-surface p-4.5 shadow-warm-xs">
                  <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft border border-brand-soft-border text-brand-strong font-bold shadow-warm-xs">
                      <Sparkles className="size-4.5" />
                    </span>
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-tiny font-semibold text-foreground">
                          Ide awal dari form pembuatan project
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand-stronger border border-brand-soft-border">
                          Draft Terdeteksi
                        </span>
                      </div>
                      <p className="text-small text-foreground leading-relaxed font-medium bg-surface/80 p-3.5 rounded-xl border border-border/70 whitespace-pre-wrap">
                        {projectDescription}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-brand-soft-border/50">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => useStarter(projectDescription)}
                      className="h-8 px-3 text-tiny font-semibold gap-1.5 text-foreground hover:text-brand-stronger border-border/80 hover:border-brand-soft-border bg-surface cursor-pointer shadow-warm-xs"
                    >
                      <PenTool className="size-3.5 text-brand-strong" />
                      Edit di Textarea
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy}
                      onClick={() => void send(projectDescription)}
                      className="h-8 px-3.5 text-tiny font-semibold gap-1.5 shadow-warm-xs cursor-pointer"
                    >
                      <Send className="size-3.5" />
                      Mulai Percakapan dengan Ide Ini
                    </Button>
                  </div>
                </div>
              ) : null}

              <StarterPanel onPick={useStarter} />
            </div>
          ) : null}

          {turns.map((turn, index) =>
            turn.role === "user" ? (
              <UserBubble key={index} content={turn.content} />
            ) : (
              <AssistantBubble key={index} content={turn.content} />
            ),
          )}

          {streaming !== null ? <StreamingBubble content={streaming} /> : null}
        </div>

        {/* --------------------------------------------------- Kotak tulis */}
        <div className="border-t border-border/60 bg-surface-sunken/30 p-3 sm:p-4">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                void send();
              }
            }}
            rows={2}
            placeholder={
              turns.length === 0
                ? "Ceritakan ide mentahnya — produk apa, untuk siapa, dan masalah apa yang dipecahkan…"
                : "Jawab pertanyaan klarifikasi di atas…"
            }
            disabled={busy}
            className="field-sizing-fixed resize-none bg-card text-small leading-relaxed"
          />

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-tiny text-muted-foreground">
              <kbd className="rounded border border-border bg-surface-sunken px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground">
                Ctrl / ⌘ + Enter
              </kbd>
              untuk kirim
            </span>

            <Button
              onClick={() => void send()}
              disabled={busy || input.trim().length < 10}
              size="sm"
              className="gap-1.5 shadow-warm-xs transition-all cursor-pointer"
            >
              {busy ? (
                <>
                  <Sparkles className="size-3.5 animate-spin text-[#BEF264]" />
                  <span>Memproses AI…</span>
                </>
              ) : (
                <>
                  <Send className="size-3.5" />
                  <span>{turns.length === 0 ? "Kirim ide" : "Kirim jawaban"}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- Rel samping */}
      <aside className="flex flex-col gap-4 lg:sticky lg:top-40">
        <div
          className={cn(
            "rounded-2xl border p-5 shadow-warm-xs transition-warm",
            readyForPrd
              ? "border-sage-soft-border bg-sage-soft/50"
              : "border-border/80 bg-card",
          )}
        >
          <p className="text-tiny font-bold tracking-wider text-muted-foreground uppercase">
            Langkah berikutnya
          </p>

          <ul className="mt-3 flex flex-col gap-2 text-tiny">
            <ChecklistItem done={answered > 0}>Ide awal terkirim</ChecklistItem>
            <ChecklistItem done={clarified > 0}>
              Pertanyaan klarifikasi terjawab
            </ChecklistItem>
            <ChecklistItem done={answered >= 2}>
              Detail diperdalam (2+ putaran)
            </ChecklistItem>
          </ul>

          <Button
            asChild={readyForPrd}
            disabled={!readyForPrd}
            size="sm"
            className="mt-4 w-full gap-1.5"
          >
            {readyForPrd ? (
              <Link href={`/projects/${projectId}/prd`}>
                Susun PRD <ArrowRight className="size-3.5" />
              </Link>
            ) : (
              <span>Susun PRD</span>
            )}
          </Button>

          <p className="mt-2.5 text-tiny leading-relaxed text-muted-foreground">
            {readyForPrd
              ? "Percakapan sudah bisa disusun jadi PRD. Makin dalam jawabanmu, makin tajam task yang dihasilkan nanti."
              : "Kirim ide dulu. bisavibecoding akan balik bertanya 2–3 hal yang paling menentukan."}
          </p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-warm-xs">
          <p className="flex items-center gap-1.5 text-tiny font-bold tracking-wider text-muted-foreground uppercase">
            <Lightbulb className="size-3.5 text-amber" />
            Cara menjawab
          </p>
          <ul className="mt-3 flex list-disc flex-col gap-2 pl-4 text-tiny leading-relaxed text-muted-foreground marker:text-brand">
            <li>Sebut siapa penggunanya, sespesifik mungkin.</li>
            <li>Sebut fitur yang SENGAJA dibuang di versi pertama.</li>
            <li>Kalau ragu, jawab &ldquo;bebas&rdquo; — nanti diputuskan di PRD.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ChecklistItem({
  done,
  children,
}: {
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2.5">
      <span
        aria-hidden
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border transition-all shadow-xs",
          done
            ? "border-emerald-600 bg-emerald-600 text-white font-bold"
            : "border-slate-300 bg-white text-slate-400"
        )}
      >
        {done ? (
          <Check className="size-3.5 stroke-[3] text-white" />
        ) : (
          <span className="size-1.5 rounded-full bg-slate-300" />
        )}
      </span>
      <span
        className={cn(
          "text-tiny leading-tight",
          done ? "font-semibold text-foreground" : "text-muted-foreground font-medium"
        )}
      >
        {children}
      </span>
    </li>
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex flex-col items-end gap-1.5">
      <span className="flex items-center gap-1.5 text-tiny font-medium text-muted-foreground">
        Kamu
        <span className="flex size-5 items-center justify-center rounded-full bg-brand-strong text-white">
          <User className="size-3" />
        </span>
      </span>
      <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-sm border border-brand-soft-border bg-brand-soft px-4 py-3 text-small leading-relaxed whitespace-pre-wrap text-foreground shadow-warm-xs">
        {content}
      </div>
    </div>
  );
}

function AssistantBubble({ content }: { content: string }) {
  return (
    <div className="flex w-full flex-col items-start gap-1.5">
      <div className="flex w-full items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-tiny font-semibold text-brand-stronger">
          <span className="flex size-5 items-center justify-center rounded-full bg-brand-soft">
            <Sparkles className="size-3 text-brand-strong" />
          </span>
          bisavibecoding
        </span>
        <CopyButton
          value={content}
          variant="ghost"
          size="xs"
          label="Salin"
          toastMessage="Balasan disalin."
          className="text-muted-foreground"
        />
      </div>
      <div className="w-full rounded-2xl rounded-tl-sm border border-border/80 bg-surface p-4 shadow-warm-xs sm:p-5">
        <StreamMarkdown content={content} />
      </div>
    </div>
  );
}

import { motion, AnimatePresence } from "motion/react";

function StreamingBubble({ content }: { content: string }) {
  const [elapsed, setElapsed] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  const THINKING_STEPS = [
    { label: "Menganalisis scope & kebutuhan ide produk", icon: Search },
    { label: "Menentukan struktur arsitektur & route map", icon: Layers },
    { label: "Merumuskan entitas database & skema relasi", icon: Database },
    { label: "Memformulasikan pertanyaan klarifikasi krusial", icon: Zap },
    { label: "Menulis balasan terstruktur", icon: PenTool },
  ];

  // Timer real-time & putaran langkah AI saat streaming berlangsung
  useEffect(() => {
    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setElapsed((Date.now() - startTime) / 1000);
    }, 100);

    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % THINKING_STEPS.length);
    }, 1500);

    return () => {
      clearInterval(timerInterval);
      clearInterval(stepInterval);
    };
  }, []);

  const CurrentStepIcon = THINKING_STEPS[stepIndex].icon;

  return (
    <div className="flex w-full flex-col items-start gap-1.5 animate-fade-up">
      {/* Status Header: Clean & Developer-focused */}
      <div className="flex w-full items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-tiny font-semibold text-foreground">
          <span className="flex size-5 items-center justify-center rounded-full bg-brand-soft border border-brand-soft-border">
            <Sparkles className="size-3 text-brand-strong" />
          </span>
          <span>bisavibecoding</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface-sunken/80 px-2.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground shadow-warm-xs">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {content.length === 0 ? "Menganalisis" : "Generating"}
          </span>
        </span>

        {/* Indikator Durasi Real-time */}
        <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-surface-sunken/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
          <Clock className="size-3 text-muted-foreground" />
          <span>{elapsed.toFixed(1)}s</span>
        </span>
      </div>

      {/* Main Thinking/Streaming Container */}
      <div className="w-full rounded-2xl rounded-tl-sm border border-border/80 bg-surface p-4.5 shadow-warm-xs transition-all sm:p-5">
        {content.length === 0 ? (
          /* Tampilan Clean & Restrained Saat AI Sedang Berpikir */
          <div className="flex flex-col gap-3">
            {/* Ticker Langkah Berpikir AI */}
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-surface-sunken/50 px-3.5 py-2.5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={stepIndex}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 font-mono text-tiny font-medium text-foreground"
                >
                  <CurrentStepIcon className="size-3.5 text-brand-strong shrink-0" />
                  <span>{THINKING_STEPS[stepIndex].label}…</span>
                </motion.div>
              </AnimatePresence>

              {/* Quiet Micro-Pulse Dots */}
              <div className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-foreground-muted/40 animate-pulse" style={{ animationDelay: "0ms" }} />
                <span className="size-1.5 rounded-full bg-foreground-muted/40 animate-pulse" style={{ animationDelay: "200ms" }} />
                <span className="size-1.5 rounded-full bg-foreground-muted/40 animate-pulse" style={{ animationDelay: "400ms" }} />
              </div>
            </div>

            {/* Clean Skeleton Shimmer Lines */}
            <div className="rounded-xl border border-border/60 bg-surface-sunken/30 p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-1/3 rounded-sm bg-surface-sunken skeleton-line" />
                <span className="h-2.5 w-1/4 rounded-sm bg-surface-sunken skeleton-line" />
              </div>
              <span className="block h-2.5 w-5/6 rounded-sm bg-surface-sunken skeleton-line" />
              <span className="block h-2.5 w-2/3 rounded-sm bg-surface-sunken skeleton-line" />
            </div>
          </div>
        ) : (
          /* Streaming Content + Modern Terminal Cursor */
          <div className="relative">
            <StreamMarkdown content={content} />
            <span className="inline-block ml-1 h-4 w-1.5 rounded-xs bg-foreground/80 animate-pulse align-middle" />
          </div>
        )}
      </div>
    </div>
  );
}

function StarterPanel({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-border-strong bg-surface-sunken/30 p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-brand-soft-border bg-brand-soft text-brand-strong">
          <Lightbulb className="size-5" />
        </span>
        <div>
          <h3 className="font-heading text-h3">Mulai dari satu kalimat</h3>
          <p className="mt-1 text-small text-muted-foreground">
            Tulis ide mentahmu apa adanya. bisavibecoding akan balik bertanya
            hal-hal yang paling menentukan bentuk produknya.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border/60 pt-4">
        <span className="text-tiny font-semibold tracking-wider text-muted-foreground uppercase">
          Atau pakai contoh ini
        </span>
        <div className="grid gap-3 sm:grid-cols-2">
          {STARTERS.map((group) => (
            <div key={group.category} className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-brand-stronger">
                {group.category}
              </span>
              {group.prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => onPick(prompt)}
                  className="rounded-xl border border-border/80 bg-card p-3 text-left text-tiny leading-relaxed text-foreground shadow-warm-xs transition-warm hover:-translate-y-0.5 hover:border-brand-soft-border hover:bg-brand-soft/40"
                >
                  {prompt}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
