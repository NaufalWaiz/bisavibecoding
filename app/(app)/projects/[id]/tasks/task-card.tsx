"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ChevronDown,
  FileCode2,
  ListChecks,
  Loader2,
  Terminal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Notice } from "@/components/app/notice";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/lib/db/schema";
import { updateTaskStatusAction } from "./actions";
import { TaskFeedbackForm } from "./task-feedback-form";

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "Todo",
  in_progress: "Dikerjakan",
  done: "Selesai",
  failed: "Gagal",
};

const STATUS_TRIGGER: Record<TaskStatus, string> = {
  todo: "",
  in_progress: "border-amber-soft-border bg-amber-soft/70 text-amber-text",
  done: "border-sage-soft-border bg-sage-soft/70 text-sage-text",
  failed: "border-danger-soft-border bg-danger-soft/70 text-danger",
};

export function TaskCard({
  task,
  index,
  projectId,
  feedbackOutcome,
}: {
  task: Task;
  index: number;
  projectId: string;
  feedbackOutcome: "success" | "failed" | null;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [isPending, startTransition] = useTransition();

  const storageKey = `bvc:criteria:${task.id}`;

  /*
   * Centang acceptance criteria disimpan di localStorage.
   *
   * Sebelumnya ini murni state React: user mencentang lima kriteria, menyegarkan
   * halaman, dan semuanya kembali kosong — checkbox yang tidak mengingat apa pun
   * lebih buruk daripada tidak ada checkbox.
   */
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) setChecked(new Set(JSON.parse(saved) as number[]));
    } catch {
      // Storage diblokir / isinya rusak — cukup mulai dari kosong.
    }
  }, [storageKey]);

  function toggleCriterion(idx: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {
        // Tidak fatal: centang tetap jalan untuk sesi ini.
      }
      return next;
    });
  }

  function changeStatus(next: TaskStatus) {
    const previous = status;
    setStatus(next);
    startTransition(async () => {
      const result = await updateTaskStatusAction(projectId, task.id, next);
      if (result.error) {
        setStatus(previous);
        toast.error(result.error);
      }
    });
  }

  const warnings = task.consistencyWarnings ?? [];
  const criteriaCount = task.acceptanceCriteria.length;

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border bg-card shadow-warm-xs transition-warm",
        open
          ? "border-brand-soft-border shadow-warm-md"
          : "border-border/80 hover:border-border-strong hover:shadow-warm-sm",
        task.isStale && !open && "border-amber-soft-border",
      )}
    >
      {/* ------------------------------------------------------- ringkasan */}
      <div className="flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-start gap-3.5">
          <span
            aria-hidden
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl font-mono text-tiny font-bold transition-warm",
              status === "done"
                ? "bg-sage-soft text-sage-text"
                : "bg-brand-soft text-brand-stronger",
            )}
          >
            {String(index + 1).padStart(2, "0")}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={cn(
                  "font-heading text-h3 leading-tight tracking-tight",
                  status === "done" && "text-muted-foreground",
                )}
              >
                {task.title}
              </h3>

              {task.isStale ? (
                <Badge
                  variant="warning"
                  title="PRD sudah berubah sejak task ini dibuat."
                  className="gap-1"
                >
                  <AlertTriangle /> stale
                </Badge>
              ) : null}

              {warnings.length > 0 ? (
                <Badge variant="secondary" title={warnings.join("\n")}>
                  {warnings.length} catatan konsistensi
                </Badge>
              ) : null}

              {feedbackOutcome ? (
                <Badge
                  variant={feedbackOutcome === "success" ? "success" : "destructive"}
                >
                  {feedbackOutcome === "success" ? "sekali jalan" : "perlu revisi"}
                </Badge>
              ) : null}
            </div>

            <p className="mt-1.5 line-clamp-2 text-small leading-relaxed text-muted-foreground">
              {task.goal}
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-tiny text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <FileCode2 className="size-3.5" />
                {task.filesTouched.length} file
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ListChecks className="size-3.5" />
                {criteriaCount} kriteria
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                {task.finalPrompt.length.toLocaleString("id-ID")} karakter prompt
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={status}
              onValueChange={(value: string) => changeStatus(value as TaskStatus)}
              disabled={isPending}
            >
              <SelectTrigger
                size="sm"
                aria-label="Status task"
                className={cn("w-36 text-tiny font-semibold", STATUS_TRIGGER[status])}
              >
                {isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <SelectValue />
                )}
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABEL) as TaskStatus[]).map((value) => (
                  <SelectItem key={value} value={value}>
                    {STATUS_LABEL[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <CopyButton
              value={task.finalPrompt}
              variant="default"
              size="sm"
              label="Copy prompt"
              copiedLabel="Prompt tersalin"
              toastMessage="Prompt disalin — siap ditempel ke AI agent."
            />
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            {open ? "Tutup detail" : "Detail task"}
            <ChevronDown
              className={cn("size-3.5 transition-warm", open && "rotate-180")}
            />
          </Button>
        </div>
      </div>

      {/* ---------------------------------------------------------- detail */}
      {open ? (
        <div className="animate-fade-up flex flex-col gap-5 border-t border-border/60 bg-surface-sunken/25 p-4 sm:p-5">
          {task.isStale ? (
            <Notice tone="warning" title="Task ini dibuat dari PRD versi lama">
              Pakai <strong>Regenerate stale</strong> di atas agar isinya
              menyesuaikan PRD terbaru tanpa mengubah task lain.
            </Notice>
          ) : null}

          {warnings.length > 0 ? (
            <Notice tone="warning" title="Catatan konsistensi (tidak memblokir)">
              <ul className="mt-1.5 list-disc space-y-1 pl-4">
                {warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </Notice>
          ) : null}

          <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
            {/* Konteks */}
            <div className="flex min-w-0 flex-col gap-5">
              <Section title="Tujuan">
                <p className="text-small leading-relaxed text-foreground">
                  {task.goal}
                </p>
              </Section>

              {task.filesTouched.length > 0 ? (
                <Section title="File yang disentuh">
                  <ul className="flex flex-wrap gap-1.5">
                    {task.filesTouched.map((file, i) => (
                      <li
                        key={i}
                        /* Path file bisa sangat panjang tanpa spasi — tanpa
                           `break-all` ia mendorong seluruh kartu melebihi layar
                           di ponsel. */
                        className="flex max-w-full items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 font-mono text-[11px] break-all text-foreground shadow-warm-xs"
                      >
                        <FileCode2 className="size-3 shrink-0 text-muted-foreground" />
                        {file}
                      </li>
                    ))}
                  </ul>
                </Section>
              ) : null}

              {task.contextSlice ? (
                <Section title="Context slice">
                  <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4 shadow-warm-xs">
                    <ContextList label="Entity" items={task.contextSlice.entities} />
                    <ContextList label="Aturan" items={task.contextSlice.rules} />
                    <ContextList
                      label="Dependensi"
                      items={task.contextSlice.dependencies}
                    />
                  </div>
                </Section>
              ) : null}

              {criteriaCount > 0 ? (
                <Section
                  title="Acceptance criteria"
                  aside={
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {checked.size}/{criteriaCount} dicentang
                    </span>
                  }
                >
                  <ul className="flex flex-col gap-2">
                    {task.acceptanceCriteria.map((criterion, i) => {
                      const done = checked.has(i);
                      return (
                        <li key={i}>
                          <label
                            className={cn(
                              "flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-small transition-warm",
                              done
                                ? "border-sage-soft-border bg-sage-soft/50 text-sage-text"
                                : "border-border bg-card hover:bg-surface-raised",
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={done}
                              onChange={() => toggleCriterion(i)}
                              className="mt-0.5 size-4 shrink-0 cursor-pointer accent-brand-strong"
                            />
                            <span className={cn(done && "line-through opacity-75")}>
                              {criterion}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </Section>
              ) : null}
            </div>

            {/* Prompt siap tempel */}
            <div className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-40">
              <Section title="Final prompt">
                <div className="overflow-hidden rounded-2xl border border-code-border bg-code-bg shadow-warm-md">
                  <div className="flex items-center justify-between gap-2 border-b border-code-border bg-code-bg-raised px-4 py-2.5">
                    <span className="flex items-center gap-2 font-mono text-tiny font-semibold text-code-muted">
                      <Terminal className="size-3.5" />
                      final_prompt.md
                    </span>
                    <CopyButton
                      value={task.finalPrompt}
                      size="xs"
                      variant="default"
                      label="Copy"
                      copiedLabel="Tersalin"
                      toastMessage="Prompt disalin — siap ditempel ke AI agent."
                    />
                  </div>

                  <pre className="pane-scroll-dark max-h-[28rem] overflow-auto p-4 font-mono text-tiny leading-relaxed break-words whitespace-pre-wrap text-code-foreground selection:bg-brand/40">
                    {task.finalPrompt}
                  </pre>
                </div>
              </Section>

              <TaskFeedbackForm
                projectId={projectId}
                taskId={task.id}
                currentOutcome={feedbackOutcome}
              />
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

/* -------------------------------------------------------------------------- */

function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <p className="text-tiny font-bold tracking-wider text-muted-foreground uppercase">
          {title}
        </p>
        {aside}
      </div>
      {children}
    </div>
  );
}

function ContextList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex min-w-0 flex-wrap items-baseline gap-2 text-small">
      <span className="shrink-0 text-tiny font-semibold text-muted-foreground">
        {label}
      </span>
      <div className="flex min-w-0 flex-wrap gap-1.5">
        {items.map((item, idx) => (
          <span
            key={idx}
            className="max-w-full rounded-md border border-border bg-surface-sunken px-2 py-0.5 font-mono text-[11px] break-words text-foreground"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
