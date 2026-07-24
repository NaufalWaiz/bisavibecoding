import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { listProjectsWithSummary } from "@/lib/db/queries/projects";
import { CountUp } from "@/components/motion/count-up";
import { EmptyState } from "@/components/app/empty-state";
import { NewProjectDialog } from "./new-project-dialog";
import { ProjectListClient } from "./projects-list-client";
import { FolderKanban, Lock, ListChecks, AlertTriangle, Layers } from "lucide-react";

export const metadata = { title: "Dashboard — bisavibecoding" };

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const projects = await listProjectsWithSummary(user.id);

  const lockedPrdCount = projects.filter((p) => p.prdStatus === "locked").length;
  const totalTasks = projects.reduce((acc, p) => acc + p.taskCount, 0);
  const staleTasks = projects.reduce((acc, p) => acc + p.staleCount, 0);

  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader
        total={projects.length}
        lockedPrd={lockedPrdCount}
        totalTasks={totalTasks}
        staleTasks={staleTasks}
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Belum ada project"
          description="Satu project = satu ide yang dirawat dari percakapan awal, jadi PRD, lalu jadi task siap tempel ke AI coding agent."
          action={<NewProjectDialog label="Buat project pertama" />}
          hint={
            <>
              Butuh waktu sekitar 5 menit sampai kamu pegang task pertama yang
              siap disalin.
            </>
          }
        />
      ) : (
        <ProjectListClient projects={projects} />
      )}
    </div>
  );
}

function DashboardHeader({
  total,
  lockedPrd,
  totalTasks,
  staleTasks,
}: {
  total: number;
  lockedPrd: number;
  totalTasks: number;
  staleTasks: number;
}) {
  /*
   * Empat angka, semuanya bisa ditindaklanjuti. Versi sebelumnya menampilkan
   * lima — termasuk "Aktif" yang selalu sama dengan total selama fitur arsip
   * belum ada, jadi tidak pernah memberi tahu apa pun.
   */
  const metrics = [
    { Icon: FolderKanban, value: total, label: "Project", tone: "plain" as const },
    { Icon: Lock, value: lockedPrd, label: "PRD terkunci", tone: "sage" as const },
    { Icon: ListChecks, value: totalTasks, label: "Task siap", tone: "plain" as const },
    {
      Icon: AlertTriangle,
      value: staleTasks,
      label: "Task stale",
      tone: staleTasks > 0 ? ("amber" as const) : ("plain" as const),
    },
  ];

  return (
    <header className="animate-fade-up relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-warm-xs sm:p-8">
      {/* Gradien tipis di pojok — memberi kedalaman tanpa mengganggu teks. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-brand-soft/60 blur-3xl"
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface-sunken/80 px-2.5 py-0.5 text-tiny font-semibold text-muted-foreground">
            <Layers className="size-3 text-brand-strong" />
            Workspace
          </span>

          <h1 className="mt-3 font-heading text-h1 tracking-tight text-foreground">
            Project kamu
          </h1>
          <p className="mt-1.5 max-w-reading text-small text-muted-foreground">
            Rawat ide dari percakapan awal, kunci jadi PRD, lalu turunkan jadi
            task yang membawa konteksnya sendiri.
          </p>
        </div>

        <div className="shrink-0">
          <NewProjectDialog />
        </div>
      </div>

      {total > 0 ? (
        <dl className="relative mt-7 grid grid-cols-2 gap-2.5 border-t border-border/60 pt-6 sm:grid-cols-4">
          {metrics.map(({ Icon, value, label, tone }, index) => (
            <div
              key={label}
              className={`animate-fade-up flex items-center gap-3 rounded-xl border px-3.5 py-2.5 shadow-warm-xs ${
                tone === "amber"
                  ? "border-amber-soft-border bg-amber-soft/70"
                  : tone === "sage" && value > 0
                    ? "border-sage-soft-border bg-sage-soft/60"
                    : "border-border/70 bg-surface-sunken/50"
              }`}
              style={{ "--stagger": index + 1 } as React.CSSProperties}
            >
              <Icon
                className={`size-4 shrink-0 ${
                  tone === "amber"
                    ? "text-amber-text"
                    : tone === "sage" && value > 0
                      ? "text-sage-strong"
                      : "text-muted-foreground"
                }`}
              />
              <div className="flex min-w-0 flex-col leading-tight">
                <CountUp
                  value={value}
                  className="font-heading text-h3 text-foreground"
                />
                <dt className="truncate text-tiny text-muted-foreground">
                  {label}
                </dt>
              </div>
            </div>
          ))}
        </dl>
      ) : null}
    </header>
  );
}
