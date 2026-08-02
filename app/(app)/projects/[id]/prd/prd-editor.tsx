"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Notice } from "@/components/app/notice";
import { StreamMarkdown, extractHeadings } from "@/components/stream-markdown";
import { splitStreamError } from "@/lib/ai/stream-error";
import { cn } from "@/lib/utils";
import type { Document } from "@/lib/db/schema";
import { lockPrdAction, savePrdAction, unlockPrdAction } from "./actions";
import {
  Clock,
  Compass,
  Copy,
  Database,
  Download,
  Eye,
  FileText,
  Layers,
  ListTree,
  Lock,
  LockOpen,
  MoreHorizontal,
  PencilLine,
  PenTool,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type Props = {
  projectId: string;
  document: Document | null;
  hasConversation?: boolean;
};

export function PrdEditor({ projectId, document, hasConversation = false }: Props) {
  const [content, setContent] = useState(document?.content ?? "");
  /** Isi terakhir yang benar-benar tersimpan — pembanding untuk status "belum disimpan". */
  const [savedContent, setSavedContent] = useState(document?.content ?? "");
  const [documentId, setDocumentId] = useState(document?.id ?? null);
  const [status, setStatus] = useState(document?.status ?? "draft");
  const [version, setVersion] = useState(document?.version ?? 1);
  const [streaming, setStreaming] = useState(false);
  const [viewMode, setViewMode] = useState<"preview" | "raw">("preview");
  const [isPending, startTransition] = useTransition();

  const busy = streaming || isPending;
  const isLocked = status === "locked";
  const hasContent = content.trim().length > 0;
  const dirty = content !== savedContent;

  const headings = useMemo(() => extractHeadings(content), [content]);
  const wordCount = useMemo(
    () => (content.trim() ? content.trim().split(/\s+/).length : 0),
    [content],
  );

  /* ---------------------------------------------------------------- aksi */

  async function generate() {
    setStreaming(true);
    setViewMode("preview");
    setContent("");

    try {
      const response = await fetch("/api/ai/prd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, tier: "premium" }),
      });

      if (!response.ok || !response.body) {
        const detail = await response
          .json()
          .then((data: { error?: string }) => data.error)
          .catch(() => null);
        throw new Error(detail ?? "Gagal menghasilkan PRD.");
      }

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let raw = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        raw += value;
        setContent(splitStreamError(raw).content);
      }

      const { content: draft, error: streamError } = splitStreamError(raw);
      if (streamError) throw new Error(streamError);

      const saved = await fetch("/api/ai/prd", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, content: draft }),
      });
      if (!saved.ok) throw new Error("PRD dihasilkan tapi gagal disimpan.");

      const data = (await saved.json()) as { documentId: string; version: number };
      setDocumentId(data.documentId);
      setVersion(data.version);
      setStatus("draft");
      setSavedContent(draft);
      toast.success("PRD dihasilkan dan tersimpan sebagai draft.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghasilkan PRD.");
    } finally {
      setStreaming(false);
    }
  }

  function save() {
    startTransition(async () => {
      const result =
        isLocked && documentId
          ? await unlockPrdAction(projectId, documentId, content)
          : await savePrdAction(projectId, content);

      if (result.error) {
        toast.error(result.error);
        return;
      }
      setStatus("draft");
      setSavedContent(content);
      if (result.documentId) setDocumentId(result.documentId);
      if (result.version) setVersion(result.version);
      toast.success(result.message ?? "Tersimpan.");
    });
  }

  function lock() {
    if (!documentId) {
      toast.error("Simpan PRD terlebih dahulu sebelum menguncinya.");
      return;
    }
    startTransition(async () => {
      // Perubahan yang belum tersimpan tidak boleh hilang diam-diam saat mengunci.
      if (dirty) {
        const saved = await unlockPrdAction(projectId, documentId, content);
        if (saved.error) {
          toast.error(saved.error);
          return;
        }
        setSavedContent(content);
      }

      const result = await lockPrdAction(projectId, documentId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setStatus("locked");
      setViewMode("preview");
      if (result.version) setVersion(result.version);
      toast.success(result.message ?? "PRD dikunci.");
    });
  }

  function unlockForEdit() {
    if (!documentId) return;
    startTransition(async () => {
      const result = await unlockPrdAction(projectId, documentId, content);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setStatus("draft");
      setSavedContent(content);
      setViewMode("raw");
      toast.success("PRD dibuka untuk diedit. Kunci lagi untuk menaikkan versi.");
    });
  }

  function downloadMarkdown() {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = "PRD.md";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  // Ctrl/⌘+S menyimpan saat sedang mengetik markdown — refleks yang otomatis
  // dipakai orang di editor, dan tanpa ini browser membuka dialog "simpan halaman".
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        if (viewMode !== "raw" || !dirty || busy) return;
        event.preventDefault();
        save();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  /* --------------------------------------------------------------- render */

  const primaryAction = !hasContent ? (
    <Button onClick={() => void generate()} disabled={busy} className="gap-1.5 font-semibold shadow-warm-brand cursor-pointer">
      <Sparkles className={cn("size-4", streaming && "animate-spin text-brand")} />
      {streaming ? "Menyusun PRD…" : "Generate PRD"}
    </Button>
  ) : isLocked ? (
    <Button
      variant="outline"
      onClick={unlockForEdit}
      disabled={busy}
      className="gap-1.5 cursor-pointer"
    >
      <LockOpen className="size-4" />
      Buka kunci & edit
    </Button>
  ) : dirty ? (
    <Button onClick={save} disabled={busy} className="gap-1.5 cursor-pointer">
      <Save className="size-4" />
      Simpan perubahan
    </Button>
  ) : (
    <Button onClick={lock} disabled={busy} className="gap-1.5 cursor-pointer">
      <Lock className="size-4" />
      Kunci PRD
    </Button>
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={FileText}
        eyebrow="Tahap 2 · Dokumen"
        title="Product Requirements Document"
        description="Sumber kebenaran project ini. Task hanya boleh diturunkan dari PRD yang sudah dikunci."
        actions={
          <>
            {hasContent && !isLocked && !dirty ? (
              <Button
                variant="outline"
                onClick={save}
                disabled={busy}
                className="gap-1.5 cursor-pointer"
              >
                <Save className="size-4" />
                Simpan
              </Button>
            ) : null}

            {primaryAction}

            {hasContent ? (
              <>
                {/*
                 * Dialog konfirmasi sengaja TIDAK ditaruh di dalam dropdown:
                 * menutup dropdown ikut melepas trigger dialognya, jadi dialog
                 * bisa hilang tepat setelah muncul.
                 */}
                <ConfirmDialog
                  tone="danger"
                  title="Generate ulang PRD?"
                  description="Isi PRD sekarang akan ditimpa hasil generasi baru. Kalau ada bagian yang sudah kamu edit sendiri, salin dulu sebelum melanjutkan."
                  confirmLabel="Ya, timpa PRD"
                  onConfirm={() => void generate()}
                  trigger={
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={busy}
                      aria-label="Generate ulang PRD"
                      title="Generate ulang PRD"
                      className="cursor-pointer"
                    >
                      <RotateCcw className="size-4" />
                    </Button>
                  }
                />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="Aksi lain" className="cursor-pointer">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                      onSelect={() => {
                        void navigator.clipboard
                          .writeText(content)
                          .then(() => toast.success("Markdown PRD disalin."))
                          .catch(() => toast.error("Browser menolak akses clipboard."));
                      }}
                    >
                      <Copy className="size-4" />
                      Salin markdown
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={downloadMarkdown}>
                      <Download className="size-4" />
                      Unduh PRD.md
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() =>
                        setViewMode(viewMode === "raw" ? "preview" : "raw")
                      }
                      disabled={isLocked && viewMode === "preview"}
                    >
                      {viewMode === "raw" ? (
                        <>
                          <Eye className="size-4" />
                          Pratinjau
                        </>
                      ) : (
                        <>
                          <PencilLine className="size-4" />
                          Edit markdown
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : null}
          </>
        }
        meta={
          hasContent ? (
            <div className="flex flex-wrap items-center gap-2 text-tiny">
              {isLocked ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sage-soft-border bg-sage-soft px-2.5 py-0.5 font-semibold text-sage-text">
                  <Lock className="size-3" /> Terkunci · versi {version}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-soft-border bg-amber-soft px-2.5 py-0.5 font-semibold text-amber-text">
                  <PencilLine className="size-3" /> Draft · versi {version}
                </span>
              )}

              {dirty ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-surface-sunken px-2.5 py-0.5 font-medium text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-amber" />
                  Belum disimpan
                </span>
              ) : null}

              <span className="font-mono text-muted-foreground">
                {wordCount.toLocaleString("id-ID")} kata · {headings.length} bagian
              </span>
            </div>
          ) : null
        }
      />

      {isLocked && !streaming ? (
        <Notice tone="success">
          PRD versi {version} terkunci. Semua task diturunkan dari versi ini —
          kalau kamu membukanya lalu mengunci lagi, versinya naik dan task lama
          ditandai <strong>stale</strong>.
        </Notice>
      ) : null}

      {hasContent && !isLocked && !streaming ? (
        <Notice
          tone="warning"
          action={
            <Button size="sm" onClick={lock} disabled={busy} className="gap-1.5 cursor-pointer">
              <Lock className="size-3.5" />
              Kunci PRD
            </Button>
          }
        >
          PRD masih draft. Tab <strong>Task</strong> baru bisa dipakai setelah
          dokumen ini dikunci.
        </Notice>
      ) : null}

      {/* ------------------------------------------------------------ isi */}
      {streaming ? (
        <PrdStreamingShowcase content={content} streaming={streaming} />
      ) : !hasContent ? (
        <EmptyState
          icon={FileText}
          title="Belum ada PRD"
          description={
            hasConversation
              ? "Percakapan intake sudah siap disusun menjadi dokumen terstruktur: ringkasan, target user, fitur, entity, dan aturan."
              : "PRD diturunkan dari percakapan intake. Kamu bisa langsung generate, tapi hasilnya jauh lebih tajam kalau ide sudah diklarifikasi dulu."
          }
          action={
            <Button onClick={() => void generate()} disabled={busy} className="gap-2 font-semibold shadow-warm-brand cursor-pointer">
              <Sparkles className="size-4" />
              Generate PRD sekarang
            </Button>
          }
          hint={
            hasConversation ? null : (
              <Link
                href={`/projects/${projectId}`}
                className="font-semibold text-brand-stronger underline underline-offset-4"
              >
                Mulai dari intake ide dulu →
              </Link>
            )
          }
        />
      ) : viewMode === "raw" ? (
        <MarkdownEditor
          content={content}
          onChange={setContent}
          onRevert={() => setContent(savedContent)}
          onPreview={() => setViewMode("preview")}
          dirty={dirty}
          disabled={busy}
        />
      ) : (
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
          <TableOfContents
            headings={headings}
            onEdit={isLocked ? undefined : () => setViewMode("raw")}
          />

          <article className="min-w-0 flex-1 rounded-2xl border border-border/80 bg-card p-6 shadow-warm-xs sm:p-8">
            <div className="mx-auto max-w-reading">
              <StreamMarkdown content={content} className="text-small text-foreground" />
            </div>
          </article>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/** Daftar isi dengan penanda bagian yang sedang dibaca. */
function TableOfContents({
  headings,
  onEdit,
}: {
  headings: ReturnType<typeof extractHeadings>;
  onEdit?: () => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const threshold = 180;
      let current = headings[0].id;
      for (const heading of headings) {
        const node = window.document.getElementById(heading.id);
        if (node && node.getBoundingClientRect().top <= threshold) {
          current = heading.id;
        }
      }
      setActiveId(current);
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav
      aria-label="Daftar isi PRD"
      className="hidden xl:sticky xl:top-36 xl:block w-64 shrink-0"
    >
      <div className="rounded-2xl border border-border/80 bg-surface/90 p-4 shadow-warm-xs backdrop-blur-md space-y-3">
        {/* Header Navigation Bar */}
        <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex size-5.5 items-center justify-center rounded-md bg-brand-soft text-brand-strong border border-brand-soft-border/60">
              <ListTree className="size-3.5" />
            </span>
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              Daftar Isi
            </span>
          </div>
          <span className="rounded-full border border-border/80 bg-surface-sunken px-2 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
            {headings.length} bagian
          </span>
        </div>

        {/* Headings List with Clean Indicator Dots */}
        <ul className="pane-scroll flex max-h-[55vh] flex-col gap-0.5 overflow-y-auto pr-1">
          {headings.map((heading) => {
            const isActive = activeId === heading.id;
            return (
              <li key={heading.id}>
                <a
                  href={`#${heading.id}`}
                  className={cn(
                    "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[12px] transition-all duration-200",
                    heading.level > 2 ? "ml-3 text-[11.5px]" : "",
                    isActive
                      ? "bg-brand-soft/40 text-foreground font-semibold border-l-2 border-brand-strong pl-2 shadow-warm-xs"
                      : "text-muted-foreground hover:bg-surface-sunken/60 hover:text-foreground font-normal"
                  )}
                  title={heading.text}
                >
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full transition-all duration-200",
                      isActive
                        ? "bg-brand-strong scale-125 shadow-[0_0_6px_rgba(5,150,105,0.6)]"
                        : "bg-border-strong/70 group-hover:bg-muted-foreground"
                    )}
                  />
                  <span className="truncate leading-snug">{heading.text}</span>
                </a>
              </li>
            );
          })}
        </ul>

        {onEdit ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="h-8 w-full gap-1.5 text-tiny font-medium rounded-xl border-border/80 bg-surface shadow-warm-xs hover:bg-brand-soft/40 hover:text-brand-stronger cursor-pointer"
          >
            <PencilLine className="size-3.5 text-brand-strong" />
            Edit Markdown
          </Button>
        ) : null}
      </div>
    </nav>
  );
}

function MarkdownEditor({
  content,
  onChange,
  onRevert,
  onPreview,
  dirty,
  disabled,
}: {
  content: string;
  onChange: (value: string) => void;
  onRevert: () => void;
  onPreview: () => void;
  dirty: boolean;
  disabled: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-warm-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-surface-sunken/40 px-4 py-2.5">
        <span className="flex items-center gap-2 font-mono text-tiny text-muted-foreground">
          <PencilLine className="size-3.5 text-brand-strong" />
          PRD.md
          {dirty ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-soft-border bg-amber-soft px-2 py-0.5 text-[10px] font-semibold text-amber-text">
              belum disimpan
            </span>
          ) : null}
        </span>

        <div className="flex items-center gap-2">
          <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
            ⌘/Ctrl + S
          </span>
          {dirty ? (
            <Button
              variant="ghost"
              size="xs"
              onClick={onRevert}
              disabled={disabled}
              className="gap-1.5"
            >
              <RotateCcw className="size-3" />
              Batalkan
            </Button>
          ) : null}
          <Button variant="outline" size="xs" onClick={onPreview} className="gap-1.5">
            <Eye className="size-3" />
            Pratinjau
          </Button>
        </div>
      </div>

      <Textarea
        ref={ref}
        value={content}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        spellCheck={false}
        className="pane-scroll field-sizing-fixed min-h-[65vh] resize-none rounded-none border-0 bg-transparent p-5 font-mono text-tiny leading-relaxed shadow-none focus-visible:ring-0"
      />
    </div>
  );
}

function PrdStreamingShowcase({ content, streaming }: { content: string; streaming: boolean }) {
  const [elapsed, setElapsed] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  const PRD_THINKING_STEPS = [
    { label: "Membaca percakapan intake & mengekstrak konteks produk", icon: Search },
    { label: "Menyusun ringkasan eksekutif & arsitektur sistem", icon: Layers },
    { label: "Mengkristalkan skema database, tabel, & relasi Drizzle", icon: Database },
    { label: "Memetakan route API, server actions, & boundary", icon: Compass },
    { label: "Menentukan rule guardrails & kebijakan keamanan", icon: ShieldCheck },
    { label: "Menuliskan dokumen PRD Markdown terstruktur v1.0", icon: PenTool },
  ];

  useEffect(() => {
    if (!streaming) return;
    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setElapsed((Date.now() - startTime) / 1000);
    }, 100);

    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % PRD_THINKING_STEPS.length);
    }, 1400);

    return () => {
      clearInterval(timerInterval);
      clearInterval(stepInterval);
    };
  }, [streaming]);

  const CurrentStepIcon = PRD_THINKING_STEPS[stepIndex].icon;

  return (
    <div className="flex flex-col gap-4 animate-fade-up">
      {/* Live AI Header & Temporary Elapsed Timer Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-soft-border bg-[#0F172A] px-5 py-3.5 text-white shadow-warm-md">
        <div className="flex items-center gap-3">
          <span className="relative flex size-8 items-center justify-center rounded-xl bg-brand-soft/20 border border-brand-soft-border/40">
            <Sparkles className="size-4 text-brand animate-spin" style={{ animationDuration: "3s" }} />
            <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-brand animate-ping" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-small font-bold text-white">
                Sintesis PRD Arsitektur AI
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-soft-border/50 bg-brand-soft/20 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-brand">
                <span className="size-1.5 rounded-full bg-brand animate-pulse" />
                {content.length === 0 ? "Menganalisis" : "Generating"}
              </span>
            </div>
            <p className="text-tiny text-slate-300">
              Mengubah ide & intake menjadi single source of truth PRD terstruktur.
            </p>
          </div>
        </div>

        {/* Realtime Elapsed Timer Badge */}
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 font-mono text-tiny font-bold text-slate-200 shadow-warm-xs">
            <Clock className="size-3.5 text-brand" />
            <span>{elapsed.toFixed(1)}s</span>
          </span>
        </div>
      </div>

      {/* Main Content Area: Interactive Showcase or Streaming Document */}
      <article className="min-w-0 flex-1 rounded-2xl border border-brand-soft-border bg-surface p-6 shadow-warm-md sm:p-8">
        <div className="mx-auto max-w-reading">
          {content.length === 0 ? (
            /* Interactive Showcase when AI is thinking / waiting for first stream token */
            <div className="flex flex-col gap-5 py-4">
              {/* Dynamic Thinking Step Ticker */}
              <div className="flex items-center justify-between rounded-xl border border-brand-soft-border/80 bg-brand-soft/60 px-4 py-3 shadow-warm-xs">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={stepIndex}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center gap-2.5 text-small font-bold text-brand-stronger"
                  >
                    <CurrentStepIcon className="size-4 text-brand-strong shrink-0" />
                    <span>{PRD_THINKING_STEPS[stepIndex].label}…</span>
                  </motion.div>
                </AnimatePresence>

                {/* Bouncing Radar Waveform */}
                <div className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-brand-strong animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="size-2 rounded-full bg-brand-strong animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="size-2 rounded-full bg-brand-strong animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>

              {/* Shimmer Scanline Preview Box */}
              <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-surface-sunken/40 p-6 space-y-3.5">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-brand/20 to-transparent animate-shimmer"
                  style={{ backgroundSize: "200% 100%" }}
                />
                <div className="flex items-center gap-3">
                  <span className="h-4 w-1/3 rounded-lg bg-brand-soft border border-brand-soft-border animate-pulse" />
                  <span className="h-4 w-1/4 rounded-lg bg-surface-sunken animate-pulse" />
                </div>
                <span className="block h-3.5 w-full rounded-md bg-surface-sunken/90 animate-pulse" />
                <span className="block h-3.5 w-5/6 rounded-md bg-surface-sunken/90 animate-pulse" />
                <span className="block h-3.5 w-4/6 rounded-md bg-surface-sunken/90 animate-pulse" />
                <div className="pt-2 flex gap-3">
                  <span className="h-3 w-1/2 rounded-md bg-brand-soft/60 animate-pulse" />
                  <span className="h-3 w-1/3 rounded-md bg-surface-sunken animate-pulse" />
                </div>
              </div>
            </div>
          ) : (
            /* Stream Markdown with Glowing Terminal Cursor */
            <div className="relative">
              <StreamMarkdown content={content} className="text-small text-foreground leading-relaxed" />
              {streaming ? (
                <span className="inline-block ml-1.5 h-4.5 w-2 rounded-xs bg-brand-strong animate-pulse align-middle shadow-[0_0_10px_rgba(190,242,100,0.9)]" />
              ) : null}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
