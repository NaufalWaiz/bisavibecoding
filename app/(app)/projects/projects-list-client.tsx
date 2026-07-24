"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { buildPipeline, type PipelineStep } from "@/lib/project-progress";
import type { ProjectSummary } from "@/lib/db/queries/projects";
import { DeleteProjectButton } from "./delete-project-button";
import { NewProjectDialog } from "./new-project-dialog";
import {
  AlertTriangle,
  ArrowRight,
  FileText,
  Grid2X2,
  List,
  Lock,
  Plus,
  Search,
  X,
} from "lucide-react";

type FilterOption = "all" | "intake" | "prd_locked" | "stale";
type ViewMode = "grid" | "list";

const FILTERS: [FilterOption, string][] = [
  ["all", "Semua"],
  ["intake", "Ada ide"],
  ["prd_locked", "PRD terkunci"],
  ["stale", "Perlu perhatian"],
];

export function ProjectListClient({ projects }: { projects: ProjectSummary[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterOption>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Pilihan tampilan bertahan antar kunjungan — ini preferensi, bukan state
  // sesaat, dan mengembalikannya ke grid tiap kali terasa seperti bug.
  useEffect(() => {
    const saved = window.localStorage.getItem("bvc:projects:view");
    if (saved === "grid" || saved === "list") setViewMode(saved);
  }, []);

  function changeView(mode: ViewMode) {
    setViewMode(mode);
    window.localStorage.setItem("bvc:projects:view", mode);
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = document.activeElement?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        setSearch("");
        searchInputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects.filter((project) => {
      if (query) {
        const haystack = `${project.name} ${project.description ?? ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (filter === "intake") return (project.conversation ?? []).length > 0;
      if (filter === "prd_locked") return project.prdStatus === "locked";
      if (filter === "stale") return project.staleCount > 0;
      return true;
    });
  }, [projects, search, filter]);

  const counts: Record<FilterOption, number> = {
    all: projects.length,
    intake: projects.filter((p) => (p.conversation ?? []).length > 0).length,
    prd_locked: projects.filter((p) => p.prdStatus === "locked").length,
    stale: projects.filter((p) => p.staleCount > 0).length,
  };

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="font-heading text-h3 text-foreground">Semua project</h2>
          <span className="rounded-full border border-border/80 bg-surface-sunken px-2.5 py-0.5 font-mono text-tiny text-muted-foreground">
            {filteredProjects.length === projects.length
              ? projects.length
              : `${filteredProjects.length}/${projects.length}`}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-52 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Cari project…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 pr-9 text-small"
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
            ) : (
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border bg-surface-sunken px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                /
              </kbd>
            )}
          </div>

          <div className="flex gap-0.5 rounded-xl border border-border/80 bg-surface-sunken/80 p-1 text-tiny">
            {FILTERS.map(([key, label]) => {
              const active = filter === key;
              const count = counts[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-warm",
                    active
                      ? "bg-card text-foreground shadow-warm-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {key === "stale" && counts.stale > 0 ? (
                    <AlertTriangle className="size-3 text-amber" />
                  ) : null}
                  <span>{label}</span>
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

          <div className="hidden gap-0.5 rounded-xl border border-border/80 bg-surface-sunken/80 p-1 sm:flex">
            {(
              [
                ["grid", Grid2X2, "Tampilan kartu"],
                ["list", List, "Tampilan daftar"],
              ] as const
            ).map(([mode, Icon, title]) => (
              <button
                key={mode}
                type="button"
                onClick={() => changeView(mode)}
                title={title}
                aria-label={title}
                aria-pressed={viewMode === mode}
                className={cn(
                  "rounded-lg p-1.5 transition-warm",
                  viewMode === mode
                    ? "bg-card text-foreground shadow-warm-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong bg-card/40 px-6 py-12 text-center">
          <p className="text-small text-muted-foreground">
            Tidak ada project yang cocok
            {search ? (
              <>
                {" "}
                dengan <span className="font-medium text-foreground">“{search}”</span>
              </>
            ) : null}
            .
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setFilter("all");
            }}
            className="mt-2.5 text-tiny font-semibold text-brand-stronger underline underline-offset-4 hover:text-brand"
          >
            Bersihkan filter
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <ul className="grid gap-4 lg:grid-cols-2">
          {filteredProjects.map((project, index) => (
            <Reveal as="li" key={project.id} delay={Math.min(index, 5)}>
              <ProjectCard project={project} index={index} />
            </Reveal>
          ))}
        </ul>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-warm-xs">
          {filteredProjects.map((project, index) => (
            <li key={project.id}>
              <ProjectRow project={project} index={index} />
            </li>
          ))}
        </ul>
      )}

      {/* Ajakan buat project baru: satu baris ramping di bawah daftar.
          Sebagai kartu di dalam grid, ia jadi kotak tinggi berisi tiga baris
          teks — ruang kosong terbesar di halaman ini. */}
      <NewProjectTile />
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Kartu                                                                       */
/* -------------------------------------------------------------------------- */

function ProjectCard({
  project,
  index,
}: {
  project: ProjectSummary;
  index: number;
}) {
  const pipeline = buildPipeline({
    hasConversation: (project.conversation ?? []).length > 0,
    prdStatus: project.prdStatus,
    prdVersion: project.prdVersion,
    taskCount: project.taskCount,
    staleCount: project.staleCount,
  });

  const stack = project.techStack;
  const chips = [stack?.framework, stack?.language, stack?.database, stack?.styling]
    .filter((chip): chip is string => Boolean(chip));
  const visibleChips = chips.slice(0, 3);
  const hiddenChips = chips.length - visibleChips.length;

  const nextHref = `/projects/${project.id}${
    pipeline.next.segment ? `/${pipeline.next.segment}` : ""
  }`;

  return (
    <article className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-warm-xs transition-warm hover:-translate-y-0.5 hover:border-brand-soft-border hover:shadow-warm-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-sunken font-mono text-tiny font-bold text-muted-foreground transition-warm group-hover:bg-brand-soft group-hover:text-brand-stronger"
          >
            {String(index + 1).padStart(2, "0")}
          </span>

          <div className="min-w-0">
            <h3 className="font-heading text-h3 leading-tight tracking-tight">
              <Link
                href={`/projects/${project.id}`}
                className="transition-warm before:absolute before:inset-0 hover:text-brand-stronger focus-visible:outline-none"
              >
                {project.name}
              </Link>
            </h3>
            <p className="mt-1 line-clamp-2 text-tiny text-muted-foreground">
              {project.description ?? "Belum ada deskripsi singkat."}
            </p>
          </div>
        </div>

        <div className="relative z-10 flex shrink-0 items-center gap-1.5">
          <PrdBadge status={project.prdStatus} version={project.prdVersion} />
          <DeleteProjectButton
            projectId={project.id}
            projectName={project.name}
            iconOnly
          />
        </div>
      </div>

      {visibleChips.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {visibleChips.map((chip) => (
            <li
              key={chip}
              className="rounded-md border border-border/70 bg-surface-sunken/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
            >
              {chip}
            </li>
          ))}
          {hiddenChips > 0 ? (
            <li
              className="rounded-md border border-border/70 bg-surface-sunken/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
              title={chips.slice(3).join(" · ")}
            >
              +{hiddenChips}
            </li>
          ) : null}
        </ul>
      ) : null}

      <PipelineStrip steps={pipeline.steps} percent={pipeline.percent} />

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-3.5">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Langkah berikutnya
          </p>
          <p className="truncate text-tiny text-muted-foreground">
            {pipeline.next.hint}
          </p>
        </div>

        <Link
          href={nextHref}
          className="relative z-10 inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-tiny font-semibold text-foreground shadow-warm-xs transition-warm hover:border-brand hover:bg-brand-soft hover:text-brand-stronger"
        >
          {pipeline.next.label}
          <ArrowRight className="size-3.5 transition-warm group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}

function ProjectRow({
  project,
  index,
}: {
  project: ProjectSummary;
  index: number;
}) {
  const pipeline = buildPipeline({
    hasConversation: (project.conversation ?? []).length > 0,
    prdStatus: project.prdStatus,
    prdVersion: project.prdVersion,
    taskCount: project.taskCount,
    staleCount: project.staleCount,
  });

  return (
    <article className="group relative flex flex-wrap items-center gap-4 border-b border-border/60 px-4 py-3.5 transition-warm last:border-0 hover:bg-surface-raised/60">
      <span
        aria-hidden
        className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface-sunken font-mono text-[11px] font-bold text-muted-foreground"
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-heading text-small font-semibold">
          <Link
            href={`/projects/${project.id}`}
            className="transition-warm before:absolute before:inset-0 hover:text-brand-stronger focus-visible:outline-none"
          >
            {project.name}
          </Link>
        </h3>
        <p className="truncate text-tiny text-muted-foreground">
          {project.description ?? "Belum ada deskripsi."}
        </p>
      </div>

      <div className="hidden w-40 shrink-0 xl:block">
        <PipelineStrip steps={pipeline.steps} percent={pipeline.percent} compact />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {project.staleCount > 0 ? (
          <Badge variant="warning" className="gap-1">
            <AlertTriangle /> {project.staleCount} stale
          </Badge>
        ) : null}
        <span className="hidden font-mono text-tiny text-muted-foreground sm:inline">
          {project.taskCount} task
        </span>
        <PrdBadge status={project.prdStatus} version={project.prdVersion} />
        <span className="relative z-10">
          <DeleteProjectButton
            projectId={project.id}
            projectName={project.name}
            iconOnly
          />
        </span>
      </div>
    </article>
  );
}

function PrdBadge({
  status,
  version,
}: {
  status: ProjectSummary["prdStatus"];
  version: number | null;
}) {
  if (status === "locked") {
    return (
      <Badge variant="success" className="gap-1">
        <Lock /> v{version ?? 1}
      </Badge>
    );
  }
  if (status === "draft") {
    return (
      <Badge variant="warning" className="gap-1">
        <FileText /> Draft
      </Badge>
    );
  }
  return <Badge variant="secondary">Belum PRD</Badge>;
}

/**
 * Empat ruas yang mewakili pipeline Ide → PRD → Task → Ekspor.
 *
 * Menggantikan bar persentase generik: angka "50%" tidak memberi tahu langkah
 * mana yang tersendat, sedangkan ruas berwarna langsung menunjukkannya.
 */
function PipelineStrip({
  steps,
  percent,
  compact = false,
}: {
  steps: PipelineStep[];
  percent: number;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {!compact ? (
        <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
          <span>Pipeline</span>
          <span className="font-mono">{percent}%</span>
        </div>
      ) : null}

      <div className="flex items-center gap-1">
        {steps.map((step) => (
          <div key={step.key} className="flex-1" title={`${step.label}: ${step.detail}`}>
            <div
              className={cn(
                "h-1.5 rounded-full transition-warm",
                step.status === "done" && "bg-sage-strong",
                step.status === "warn" && "bg-amber",
                step.status === "todo" && "bg-border-strong",
                step.status === "blocked" && "bg-border",
              )}
            />
            {!compact ? (
              <span
                className={cn(
                  "mt-1 block text-[10px] leading-none",
                  step.status === "done"
                    ? "font-medium text-sage-text"
                    : step.status === "warn"
                      ? "font-medium text-amber-text"
                      : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function NewProjectTile() {
  return (
    <NewProjectDialog
      trigger={
        <button
          type="button"
          className="group flex w-full items-center gap-3 rounded-2xl border border-dashed border-border-strong bg-card/40 px-4 py-3.5 text-left transition-warm hover:border-brand hover:bg-brand-soft/25"
        >
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-sunken text-muted-foreground transition-warm group-hover:border-brand-soft-border group-hover:bg-brand-soft group-hover:text-brand-strong"
          >
            <Plus className="size-4" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block font-heading text-small font-semibold text-foreground">
              Project baru
            </span>
            <span className="block truncate text-tiny text-muted-foreground">
              Mulai arsitektur dari satu kalimat ide.
            </span>
          </span>

          <span className="shrink-0 rounded-lg border border-border bg-surface px-2.5 py-1 text-tiny font-semibold text-muted-foreground shadow-warm-xs transition-warm group-hover:border-brand group-hover:bg-brand-soft group-hover:text-brand-stronger">
            Buat
          </span>
        </button>
      }
    />
  );
}
