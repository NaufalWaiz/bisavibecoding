"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
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
  Copy,
  Download,
  Eye,
  FileText,
  ListTree,
  Lock,
  LockOpen,
  MoreHorizontal,
  PencilLine,
  RotateCcw,
  Save,
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
    <Button onClick={() => void generate()} disabled={busy} className="gap-1.5">
      <Sparkles className="size-4" />
      {streaming ? "Menulis PRD…" : "Generate PRD"}
    </Button>
  ) : isLocked ? (
    <Button
      variant="outline"
      onClick={unlockForEdit}
      disabled={busy}
      className="gap-1.5"
    >
      <LockOpen className="size-4" />
      Buka kunci & edit
    </Button>
  ) : dirty ? (
    <Button onClick={save} disabled={busy} className="gap-1.5">
      <Save className="size-4" />
      Simpan perubahan
    </Button>
  ) : (
    <Button onClick={lock} disabled={busy} className="gap-1.5">
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
                className="gap-1.5"
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
                    >
                      <RotateCcw className="size-4" />
                    </Button>
                  }
                />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="Aksi lain">
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
            <Button size="sm" onClick={lock} disabled={busy} className="gap-1.5">
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
      {!hasContent && !streaming ? (
        <EmptyState
          icon={FileText}
          title="Belum ada PRD"
          description={
            hasConversation
              ? "Percakapan intake sudah siap disusun menjadi dokumen terstruktur: ringkasan, target user, fitur, entity, dan aturan."
              : "PRD diturunkan dari percakapan intake. Kamu bisa langsung generate, tapi hasilnya jauh lebih tajam kalau ide sudah diklarifikasi dulu."
          }
          action={
            <Button onClick={() => void generate()} disabled={busy} className="gap-2">
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

              {streaming ? (
                <p className="mt-5 flex items-center gap-2 text-tiny text-muted-foreground">
                  <span className="size-1.5 animate-ping rounded-full bg-brand" />
                  bisavibecoding sedang menyusun PRD…
                </p>
              ) : null}
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
      className="hidden xl:sticky xl:top-36 xl:block w-60 shrink-0"
    >
      <div className="rounded-2xl border border-border/80 bg-card p-3.5 shadow-warm-xs backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="flex size-6 items-center justify-center rounded-md bg-brand-soft border border-brand-soft-border text-brand-strong shadow-warm-xs">
              <ListTree className="size-3.5" />
            </span>
            <span className="text-tiny font-bold tracking-wider text-foreground uppercase">
              Daftar Isi
            </span>
          </div>
          <span className="rounded-full border border-border bg-surface-sunken px-2 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
            {headings.length} Bagian
          </span>
        </div>

        <ul className="pane-scroll mt-2.5 flex max-h-[55vh] flex-col gap-1 overflow-y-auto pr-1">
          {headings.map((heading, idx) => {
            const isActive = activeId === heading.id;
            return (
              <li key={heading.id}>
                <a
                  href={`#${heading.id}`}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg px-2 py-1 text-tiny transition-all duration-200",
                    heading.level > 2 ? "ml-2.5 text-[11px]" : "font-medium",
                    isActive
                      ? "bg-brand-soft/80 text-brand-stronger font-bold border-l-2 border-brand-strong shadow-warm-xs pl-1.5"
                      : "text-muted-foreground hover:bg-surface-sunken hover:text-foreground",
                  )}
                  title={heading.text}
                >
                  <span
                    className={cn(
                      "flex size-4.5 shrink-0 items-center justify-center rounded font-mono text-[9px] font-bold transition-colors",
                      isActive
                        ? "bg-brand-strong text-white"
                        : "bg-surface-sunken text-muted-foreground group-hover:bg-card group-hover:text-foreground",
                    )}
                  >
                    {idx + 1}
                  </span>
                  <span className="truncate leading-tight">{heading.text}</span>
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
            className="mt-3 h-8 w-full gap-1.5 text-tiny rounded-lg shadow-warm-xs"
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
