import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/server";
import { getProject } from "@/lib/db/queries/projects";
import { getDocumentByType } from "@/lib/db/queries/documents";
import { listTasks } from "@/lib/db/queries/tasks";
import { findUnknownEntities } from "@/lib/ai/consistency";
import {
  getFeedbackSummary,
  getLatestFeedbackByTask,
} from "@/lib/db/queries/task_feedback";
import { CountUp } from "@/components/motion/count-up";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Notice } from "@/components/app/notice";
import { GenerateTasksButton } from "./generate-tasks-button";
import { TasksListClient } from "./tasks-list-client";
import { ListChecks, Target, Lock, FileText } from "lucide-react";

export default async function TasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const project = await getProject(id, user.id);
  if (!project) notFound();

  const prd = await getDocumentByType(project.id, user.id, "prd");
  const tasks = await listTasks(project.id, user.id);
  const staleCount = tasks.filter((task) => task.isStale).length;
  const prdLocked = prd?.status === "locked";

  const statusCount = {
    todo: tasks.filter((t) => t.status === "todo").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
    failed: tasks.filter((t) => t.status === "failed").length,
  };

  const [feedbackByTask, feedback] = await Promise.all([
    getLatestFeedbackByTask(project.id, user.id),
    getFeedbackSummary(project.id, user.id),
  ]);

  const feedbackByTaskMap: Record<string, "success" | "failed" | null> = {};
  for (const task of tasks) {
    feedbackByTaskMap[task.id] = feedbackByTask.get(task.id) ?? null;
  }

  /*
   * Konsistensi (T3.3) dihitung ulang terhadap PRD yang berlaku sekarang, bukan
   * dibaca dari `consistency_warnings` yang dibekukan saat generate. Efeknya:
   * begitu user melengkapi PRD, peringatannya hilang sendiri — tanpa harus
   * regenerate task hanya untuk membungkam sebuah label.
   */
  const unknownEntitiesByTask: Record<string, string[]> = {};
  for (const task of tasks) {
    unknownEntitiesByTask[task.id] = prd?.content
      ? findUnknownEntities(task.contextSlice?.entities ?? [], prd.content)
      : [];
  }
  const offPrdEntities = [
    ...new Set(Object.values(unknownEntitiesByTask).flat()),
  ];

  return (
    <section className="flex flex-col gap-5">
      <PageHeader
        icon={ListChecks}
        eyebrow="Tahap 3 · Eksekusi"
        title="Task prompts"
        description="Tiap task membawa konteksnya sendiri. Salin final prompt-nya langsung ke Claude Code, Cursor, atau Windsurf."
        actions={
          <GenerateTasksButton
            projectId={project.id}
            hasTasks={tasks.length > 0}
            staleCount={staleCount}
            prdLocked={prdLocked}
          />
        }
      />

      {!prdLocked ? (
        <Notice
          tone="warning"
          action={
            <Link
              href={`/projects/${project.id}/prd`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-soft-border bg-card px-3 py-1.5 text-tiny font-semibold text-amber-text shadow-warm-xs transition-warm hover:bg-amber-soft"
            >
              <Lock className="size-3.5" />
              Buka PRD
            </Link>
          }
        >
          Task hanya bisa dihasilkan dari PRD yang sudah dikunci — itu yang
          membuat tiap task punya versi sumber yang bisa dilacak.
        </Notice>
      ) : null}

      {tasks.length > 0 ? (
        <InsightBar
          successRate={feedback.successRate}
          rated={feedback.rated}
          success={feedback.success}
          failed={feedback.failed}
          total={tasks.length}
          statusCount={statusCount}
          prdVersion={prd?.version ?? null}
        />
      ) : null}

      {staleCount > 0 ? (
        <Notice
          tone="warning"
          title={`${staleCount} task dibuat dari PRD versi lama`}
          action={
            <GenerateTasksButton
              projectId={project.id}
              hasTasks
              staleCount={staleCount}
              prdLocked={prdLocked}
              staleOnly
            />
          }
        >
          PRD sekarang versi {prd?.version}. Regenerate task stale agar ikut
          menyesuaikan — task lain tidak akan tersentuh.
        </Notice>
      ) : null}

      {offPrdEntities.length > 0 ? (
        <Notice
          tone="warning"
          title={`${offPrdEntities.length} entity disebut task tapi tidak ada di PRD`}
          action={
            <Link
              href={`/projects/${project.id}/prd`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-soft-border bg-card px-3 py-1.5 text-tiny font-semibold text-amber-text shadow-warm-xs transition-warm hover:bg-amber-soft"
            >
              <FileText className="size-3.5" />
              Lengkapi PRD
            </Link>
          }
        >
          <span className="flex flex-wrap items-center gap-1.5">
            {offPrdEntities.map((entity) => (
              <code
                key={entity}
                className="rounded-md border border-amber-soft-border bg-card px-1.5 py-0.5 font-mono text-[11px] text-amber-text"
              >
                {entity}
              </code>
            ))}
          </span>
          <span className="mt-2 block">
            Ini hanya sinyal, bukan penghalang — task tetap bisa dipakai. Entah
            PRD-nya yang kurang lengkap, atau task-nya yang mengarang entity.
          </span>
        </Notice>
      ) : null}

      {tasks.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Belum ada task"
          description={
            prdLocked
              ? "PRD sudah terkunci. Turunkan jadi task berukuran satu sesi fokus AI agent, lengkap dengan context slice dan acceptance criteria."
              : "Kunci PRD terlebih dahulu, lalu task siap dihasilkan dari versi itu."
          }
          action={
            <GenerateTasksButton
              projectId={project.id}
              hasTasks={false}
              staleCount={0}
              prdLocked={prdLocked}
            />
          }
        />
      ) : (
        <TasksListClient
          tasks={tasks}
          projectId={project.id}
          feedbackByTaskMap={feedbackByTaskMap}
          unknownEntitiesByTask={unknownEntitiesByTask}
        />
      )}
    </section>
  );
}

/**
 * Satu papan metrik, bukan dua kartu terpisah.
 *
 * Angka paling penting produk ini adalah "sekali jalan benar" (PRD §4), jadi
 * ia mendapat kolom pertama dan ukuran terbesar; sisanya jadi konteks.
 */
function InsightBar({
  successRate,
  rated,
  success,
  failed,
  total,
  statusCount,
  prdVersion,
}: {
  successRate: number | null;
  rated: number;
  success: number;
  failed: number;
  total: number;
  statusCount: { todo: number; in_progress: number; done: number; failed: number };
  prdVersion: number | null;
}) {
  const statuses = [
    { label: "Todo", value: statusCount.todo, dot: "bg-border-strong" },
    { label: "Dikerjakan", value: statusCount.in_progress, dot: "bg-amber" },
    { label: "Selesai", value: statusCount.done, dot: "bg-sage-strong" },
    { label: "Gagal", value: statusCount.failed, dot: "bg-danger" },
  ];

  return (
    <div className="animate-fade-up grid overflow-hidden rounded-2xl border border-border/80 bg-card shadow-warm-xs lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      {/* Akurasi prompt */}
      <div className="border-b border-border/60 p-5 lg:border-b-0 lg:border-r">
        <p className="flex items-center gap-1.5 text-tiny font-bold tracking-wider text-muted-foreground uppercase">
          <Target className="size-3.5 text-brand-strong" />
          Sekali jalan benar
        </p>

        {successRate === null ? (
          <div className="mt-3 flex items-start gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-sunken font-heading text-h3 text-muted-foreground">
              —
            </span>
            <p className="text-tiny leading-relaxed text-muted-foreground">
              Belum ada task yang dinilai. Buka detail task, lalu jawab satu
              pertanyaan setelah kamu pakai prompt-nya.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-2 flex items-baseline gap-2">
              <CountUp
                value={successRate}
                suffix="%"
                className="font-heading text-h1 text-sage-text"
              />
              <span className="text-tiny text-muted-foreground">
                dari {rated} task dinilai
              </span>
            </div>

            <div
              className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-sunken"
              role="img"
              aria-label={`${successRate} persen task berhasil sekali jalan`}
            >
              <div
                className="h-full rounded-full bg-sage-strong transition-warm"
                style={{ width: `${successRate}%` }}
              />
            </div>

            <p className="mt-2 text-tiny text-muted-foreground">
              {success} sukses · {failed} perlu revisi · {total - rated} belum
              dinilai
            </p>
          </>
        )}
      </div>

      {/* Progres pengerjaan */}
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-tiny font-bold tracking-wider text-muted-foreground uppercase">
            Progres pengerjaan
          </p>
          {prdVersion ? (
            <span className="rounded-full border border-border bg-surface-sunken px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              {total} task · PRD v{prdVersion}
            </span>
          ) : null}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {statuses.map(({ label, value, dot }) => (
            <div
              key={label}
              className="flex flex-col gap-1 rounded-xl border border-border/70 bg-surface-sunken/50 px-3 py-2.5"
            >
              <span className="flex items-center gap-1.5 text-tiny text-muted-foreground">
                <span aria-hidden className={`size-2 rounded-full ${dot}`} />
                {label}
              </span>
              <CountUp
                value={value}
                className="font-heading text-h3 text-foreground"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
