"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Archive,
  Code2,
  Download,
  Loader2,
  PencilLine,
  Sparkles,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/ui/copy-button";
import { PageHeader } from "@/components/app/page-header";
import { Notice } from "@/components/app/notice";
import { splitStreamError } from "@/lib/ai/stream-error";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/db/schema";

type Kind = "claude" | "cursor";

const FILES: Record<
  Kind,
  { file: string; tool: string; desc: string; Icon: typeof Terminal }
> = {
  claude: {
    file: "CLAUDE.md",
    tool: "Claude Code",
    desc: "Memori repo untuk agent: ringkasan produk, stack, dan konvensi.",
    Icon: Terminal,
  },
  cursor: {
    file: ".cursorrules",
    tool: "Cursor",
    desc: "System prompt proyek: standar koding untuk seluruh sesi editor.",
    Icon: Code2,
  },
};

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function RulesExport({
  projectId,
  projectName,
  hasPrd,
  tasks,
}: {
  projectId: string;
  projectName: string;
  hasPrd: boolean;
  tasks: Pick<Task, "title" | "goal" | "finalPrompt">[];
}) {
  const [contents, setContents] = useState<Record<Kind, string>>({
    claude: "",
    cursor: "",
  });
  const [busy, setBusy] = useState<Kind | null>(null);
  const [editing, setEditing] = useState<Kind | null>(null);

  async function generate(kind: Kind) {
    setBusy(kind);
    setContents((prev) => ({ ...prev, [kind]: "" }));

    try {
      const response = await fetch("/api/ai/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, kind, tier: "default" }),
      });

      if (!response.ok || !response.body) {
        const detail = await response
          .json()
          .then((data: { error?: string }) => data.error)
          .catch(() => null);
        throw new Error(detail ?? "Gagal menghasilkan file.");
      }

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let raw = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        raw += value;
        setContents((prev) => ({ ...prev, [kind]: splitStreamError(raw).content }));
      }

      const { error: streamError } = splitStreamError(raw);
      if (streamError) throw new Error(streamError);
      toast.success(`${FILES[kind].file} siap diunduh.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menghasilkan file.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function generateAll() {
    await generate("claude");
    await generate("cursor");
  }

  const bundle = [
    `# Prompt Task — ${projectName}`,
    "",
    ...tasks.flatMap((task, index) => [
      `## ${index + 1}. ${task.title}`,
      "",
      `_${task.goal}_`,
      "",
      "```markdown",
      task.finalPrompt,
      "```",
      "",
    ]),
  ].join("\n");

  const ready =
    (contents.claude ? 1 : 0) + (contents.cursor ? 1 : 0) + (tasks.length > 0 ? 1 : 0);

  return (
    <div className="flex flex-col gap-5">
      {/*
       * Tombol "generate keduanya" naik ke header. Sebelumnya ia menempati
       * kartu ringkasan tersendiri di atas dua kartu berkas — satu kartu penuh
       * hanya untuk mengulang aksi yang sudah ada di masing-masing kartu.
       */}
      <PageHeader
        icon={Download}
        eyebrow="Tahap 4 · Ekspor"
        title="File untuk repo"
        description="Aturan repo yang dibaca AI coding agent, plus seluruh prompt task dalam satu berkas."
        actions={
          <Button
            /* Sekunder: tiap kartu sudah punya tombol generate-nya sendiri,
               yang ini cuma pintasan supaya tidak menekan dua kali. */
            variant="outline"
            onClick={() => void generateAll()}
            disabled={!hasPrd || busy !== null}
            className="gap-1.5"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {busy ? "Menulis…" : "Generate file aturan"}
          </Button>
        }
        meta={
          <span className="inline-flex items-center gap-2 text-tiny text-muted-foreground">
            <span className="flex gap-1" aria-hidden>
              {[0, 1, 2].map((index) => (
                <span
                  key={index}
                  className={cn(
                    "h-1.5 w-6 rounded-full transition-warm",
                    index < ready ? "bg-sage-strong" : "bg-border-strong",
                  )}
                />
              ))}
            </span>
            {ready} dari 3 berkas siap
          </span>
        }
      />

      {!hasPrd ? (
        <Notice
          tone="warning"
          action={
            <Link
              href={`/projects/${projectId}/prd`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-soft-border bg-card px-3 py-1.5 text-tiny font-semibold text-amber-text shadow-warm-xs transition-warm hover:bg-amber-soft"
            >
              Buat PRD
            </Link>
          }
        >
          File aturan diturunkan dari PRD + tech stack, jadi PRD harus ada dulu.
        </Notice>
      ) : null}

      {/* Tanpa `items-start`: dua kartu berkas selalu setinggi sama, jadi
          barisnya rata walau panjang deskripsinya berbeda. */}
      <div className="grid gap-5 xl:grid-cols-2">
        {(Object.keys(FILES) as Kind[]).map((kind) => (
          <RulesPanel
            key={kind}
            kind={kind}
            content={contents[kind]}
            busy={busy === kind}
            disabled={!hasPrd || (busy !== null && busy !== kind)}
            editing={editing === kind}
            onToggleEdit={() => setEditing(editing === kind ? null : kind)}
            onChange={(value) => setContents((prev) => ({ ...prev, [kind]: value }))}
            onGenerate={() => void generate(kind)}
          />
        ))}
      </div>

      <TaskPromptsExport bundle={bundle} count={tasks.length} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function RulesPanel({
  kind,
  content,
  busy,
  disabled,
  editing,
  onToggleEdit,
  onChange,
  onGenerate,
}: {
  kind: Kind;
  content: string;
  busy: boolean;
  disabled: boolean;
  editing: boolean;
  onToggleEdit: () => void;
  onChange: (value: string) => void;
  onGenerate: () => void;
}) {
  const { file, tool, desc, Icon } = FILES[kind];
  const hasContent = content.trim().length > 0;

  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border bg-card shadow-warm-xs transition-warm",
        hasContent ? "border-sage-soft-border" : "border-border/80",
      )}
    >
      {/*
       * Satu baris: identitas berkas di kiri, aksi di kanan. Kartu ini dulu
       * terpecah tiga pita — judul, pita berisi satu tombol, lalu area kosong
       * besar berisi satu kalimat. Statusnya sekarang cukup jadi satu chip.
       */}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 p-5">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl border transition-warm",
              hasContent
                ? "border-sage-soft-border bg-sage-soft text-sage-strong"
                : "border-border bg-surface-sunken text-brand-strong",
            )}
          >
            <Icon className="size-5" />
          </span>

          <div className="min-w-0">
            <h3 className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-small font-semibold text-foreground">
                {file}
              </span>
              <span className="rounded-full border border-border bg-surface-sunken px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {tool}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  hasContent
                    ? "bg-sage-soft text-sage-text"
                    : "bg-surface-sunken text-muted-foreground",
                )}
              >
                {busy
                  ? "menulis…"
                  : hasContent
                    ? `${content.length.toLocaleString("id-ID")} karakter`
                    : "belum dibuat"}
              </span>
            </h3>
            <p className="mt-1.5 text-tiny leading-relaxed text-muted-foreground">
              {desc}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            variant={hasContent ? "outline" : "default"}
            onClick={onGenerate}
            disabled={busy || disabled}
            className="gap-1.5"
          >
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            {busy ? "Menulis…" : hasContent ? "Ulangi" : "Generate"}
          </Button>

          {hasContent ? (
            <>
              <CopyButton
                value={content}
                size="sm"
                label="Copy"
                toastMessage={`${file} disalin.`}
              />
              <Button
                size="sm"
                onClick={() => download(file, content)}
                className="gap-1.5"
              >
                <Download className="size-3.5" />
                Unduh
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {hasContent ? (
        <>
          <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-surface-sunken/40 px-4 py-1.5">
            <span className="font-mono text-[11px] text-muted-foreground">
              pratinjau
            </span>
            <Button
              size="xs"
              variant="ghost"
              onClick={onToggleEdit}
              className="gap-1.5 text-muted-foreground"
            >
              <PencilLine className="size-3" />
              {editing ? "Selesai edit" : "Edit isi"}
            </Button>
          </div>

          {editing ? (
            <Textarea
              value={content}
              onChange={(event) => onChange(event.target.value)}
              rows={14}
              className="pane-scroll field-sizing-fixed min-h-64 resize-none rounded-none border-0 bg-transparent p-4 font-mono text-tiny leading-relaxed shadow-none focus-visible:ring-0"
            />
          ) : (
            <pre className="pane-scroll-dark max-h-64 overflow-auto bg-code-bg p-4 font-mono text-tiny leading-relaxed break-words whitespace-pre-wrap text-code-foreground">
              {content}
            </pre>
          )}
        </>
      ) : null}
    </section>
  );
}

/** Ekspor seluruh final_prompt sebagai satu berkas markdown. */
function TaskPromptsExport({ bundle, count }: { bundle: string; count: number }) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-warm-xs">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-sunken text-brand-strong">
          <Archive className="size-5" />
        </span>
        <div className="min-w-0">
          <h3 className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-small font-semibold text-foreground">
              prompt-task.md
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                count > 0
                  ? "bg-sage-soft text-sage-text"
                  : "bg-surface-sunken text-muted-foreground",
              )}
            >
              {count > 0 ? `${count} prompt` : "belum ada task"}
            </span>
          </h3>
          <p className="mt-1.5 text-tiny text-muted-foreground">
            {count > 0
              ? "Seluruh final prompt dalam satu berkas berurutan, siap dibuka di editor."
              : "Generate task dulu di tahap sebelumnya."}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <CopyButton
          value={bundle}
          size="sm"
          label="Salin semua"
          toastMessage="Seluruh prompt task disalin."
          className={count === 0 ? "pointer-events-none opacity-55" : undefined}
        />
        <Button
          size="sm"
          onClick={() => download("prompt-task.md", bundle)}
          disabled={count === 0}
          className="gap-1.5"
        >
          <Download className="size-3.5" />
          Unduh bundle
        </Button>
      </div>
    </section>
  );
}
