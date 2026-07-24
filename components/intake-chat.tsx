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
  Lightbulb,
  MessagesSquare,
  RotateCcw,
  Send,
  Sparkles,
  User,
} from "lucide-react";

type Props = {
  projectId: string;
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

export function IntakeChat({ projectId, initialConversation }: Props) {
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
            <StarterPanel onPick={useStarter} />
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
              className="gap-1.5"
            >
              <Send className="size-3.5" />
              {busy ? "Memproses…" : turns.length === 0 ? "Kirim ide" : "Kirim jawaban"}
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
    <li className="flex items-center gap-2">
      <span
        aria-hidden
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-full border transition-warm",
          done
            ? "border-sage-strong bg-sage-strong text-white"
            : "border-border-strong bg-surface",
        )}
      >
        {done ? <Check className="size-2.5 stroke-[3]" /> : null}
      </span>
      <span className={done ? "text-foreground" : "text-muted-foreground"}>
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

function StreamingBubble({ content }: { content: string }) {
  return (
    <div className="flex w-full flex-col items-start gap-1.5">
      <span className="flex items-center gap-2 text-tiny font-semibold text-brand-stronger">
        <span className="flex size-5 items-center justify-center rounded-full bg-brand-soft">
          <Sparkles className="size-3 animate-pulse text-brand-strong" />
        </span>
        bisavibecoding
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-soft-border bg-brand-soft px-2 py-0.5 text-[10px] font-medium">
          <span className="size-1.5 animate-ping rounded-full bg-brand" />
          menulis…
        </span>
      </span>

      <div className="w-full rounded-2xl rounded-tl-sm border border-border/80 bg-surface p-4 shadow-warm-xs sm:p-5">
        {content.length === 0 ? (
          <div className="flex flex-col gap-2.5" aria-label="Menganalisis ide">
            <span className="skeleton-line h-3 w-3/4" />
            <span className="skeleton-line h-3 w-full" />
            <span className="skeleton-line h-3 w-5/6" />
          </div>
        ) : (
          <StreamMarkdown content={content} />
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
