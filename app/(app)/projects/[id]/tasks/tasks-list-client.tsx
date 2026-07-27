"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Search, X } from "lucide-react";
import type { Task } from "@/lib/db/schema";
import { TaskCard } from "./task-card";
import { Reveal } from "@/components/motion/reveal";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";

type FilterStatus = "all" | "todo" | "in_progress" | "done" | "failed" | "stale";

export function TasksListClient({
  tasks,
  projectId,
  feedbackByTaskMap,
  unknownEntitiesByTask,
}: {
  tasks: Task[];
  projectId: string;
  feedbackByTaskMap: Record<string, "success" | "failed" | null>;
  /** Entity yang disebut task tapi tidak ada di PRD terkini (T3.3). */
  unknownEntitiesByTask: Record<string, string[]>;
}) {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      if (query) {
        const haystack = `${task.title} ${task.goal} ${task.filesTouched.join(" ")}`;
        if (!haystack.toLowerCase().includes(query)) return false;
      }
      if (filter === "stale") return task.isStale;
      if (filter !== "all") return task.status === filter;
      return true;
    });
  }, [tasks, filter, search]);

  const counts = {
    all: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
    failed: tasks.filter((t) => t.status === "failed").length,
    stale: tasks.filter((t) => t.isStale).length,
  };

  const filters: [FilterStatus, string][] = [
    ["all", "Semua"],
    ["todo", "Todo"],
    ["in_progress", "Dikerjakan"],
    ["done", "Selesai"],
    ["failed", "Gagal"],
    ...(counts.stale > 0 ? ([["stale", "Stale"]] as [FilterStatus, string][]) : []),
  ];

  // Bundel prompt mengikuti hasil filter, bukan seluruh task: kalau kamu sedang
  // menyaring "Todo", yang kamu maksud "salin semua" adalah yang terlihat.
  const bundle = filtered
    .map(
      (task, index) =>
        `## ${index + 1}. ${task.title}\n\n${task.finalPrompt}\n`,
    )
    .join("\n---\n\n");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-0.5 rounded-xl border border-border/80 bg-surface-sunken/80 p-1 text-tiny">
          {filters.map(([key, label]) => {
            const active = filter === key;
            const count = counts[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition-warm",
                  active
                    ? "bg-card text-foreground shadow-warm-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {key === "stale" ? (
                  <AlertTriangle className="size-3 text-amber" />
                ) : null}
                {label}
                <span
                  className={cn(
                    "font-mono text-[10px]",
                    active ? "text-brand-stronger" : "text-muted-foreground/70",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative min-w-52 flex-1 lg:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari judul atau file…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-9 pl-9 pr-8 text-small"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Bersihkan pencarian"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-warm hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          {filtered.length > 0 ? (
            <CopyButton
              value={bundle}
              size="sm"
              label={`Salin ${filtered.length} prompt`}
              copiedLabel="Semua tersalin"
              toastMessage={`${filtered.length} prompt disalin sebagai satu berkas.`}
              className="shrink-0"
            />
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong bg-card/40 px-6 py-12 text-center">
          <p className="text-small text-muted-foreground">
            Tidak ada task yang cocok dengan filter ini.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilter("all");
              setSearch("");
            }}
            className="mt-2.5 text-tiny font-semibold text-brand-stronger underline underline-offset-4 hover:text-brand"
          >
            Bersihkan filter
          </button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {filtered.map((task, index) => (
            <Reveal as="li" key={task.id} delay={Math.min(index, 4)}>
              <TaskCard
                task={task}
                index={index}
                projectId={projectId}
                feedbackOutcome={feedbackByTaskMap[task.id] ?? null}
                unknownEntities={unknownEntitiesByTask[task.id] ?? []}
              />
            </Reveal>
          ))}
        </ul>
      )}
    </div>
  );
}
