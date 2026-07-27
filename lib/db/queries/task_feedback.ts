import "server-only";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  projects,
  taskFeedback,
  tasks,
  type FeedbackOutcome,
  type TaskFeedback,
} from "@/lib/db/schema";

/**
 * Feedback task adalah bahan metrik utama produk: "% task yang prompt-nya
 * membuat AI agent sekali jalan benar" (PRD §4).
 */

async function ownsTask(taskId: string, userId: string): Promise<string | null> {
  const [row] = await db
    .select({ projectId: tasks.projectId })
    .from(tasks)
    .innerJoin(projects, eq(projects.id, tasks.projectId))
    .where(and(eq(tasks.id, taskId), eq(projects.userId, userId)))
    .limit(1);
  return row?.projectId ?? null;
}

export async function addTaskFeedback(input: {
  taskId: string;
  userId: string;
  outcome: FeedbackOutcome;
  notes?: string | null;
}): Promise<TaskFeedback | null> {
  const projectId = await ownsTask(input.taskId, input.userId);
  if (!projectId) return null;

  const [row] = await db
    .insert(taskFeedback)
    .values({
      taskId: input.taskId,
      outcome: input.outcome,
      notes: input.notes?.trim() || null,
    })
    .returning();
  return row ?? null;
}

/**
 * Feedback TERAKHIR per task dalam sebuah project.
 *
 * Sengaja mengambil yang terakhir, bukan menghitung semua baris: user boleh
 * mengubah penilaiannya setelah mencoba ulang, dan yang dihitung adalah
 * penilaian terkini.
 */
export async function getLatestFeedbackByTask(
  projectId: string,
  userId: string,
): Promise<Map<string, FeedbackOutcome>> {
  const rows = await db
    .select({
      taskId: taskFeedback.taskId,
      outcome: taskFeedback.outcome,
      createdAt: taskFeedback.createdAt,
    })
    .from(taskFeedback)
    .innerJoin(tasks, eq(tasks.id, taskFeedback.taskId))
    .innerJoin(projects, eq(projects.id, tasks.projectId))
    .where(and(eq(tasks.projectId, projectId), eq(projects.userId, userId)))
    .orderBy(desc(taskFeedback.createdAt));

  const latest = new Map<string, FeedbackOutcome>();
  for (const row of rows) {
    if (!latest.has(row.taskId)) latest.set(row.taskId, row.outcome);
  }
  return latest;
}

export type FeedbackSummary = {
  /** Jumlah task yang sudah dinilai. */
  rated: number;
  success: number;
  failed: number;
  /** Persentase "sekali jalan benar" dari task yang sudah dinilai. */
  successRate: number | null;
};

export async function getFeedbackSummary(
  projectId: string,
  userId: string,
): Promise<FeedbackSummary> {
  const latest = await getLatestFeedbackByTask(projectId, userId);
  let success = 0;
  let failed = 0;
  for (const outcome of latest.values()) {
    if (outcome === "success") success += 1;
    else failed += 1;
  }
  const rated = success + failed;
  return {
    rated,
    success,
    failed,
    successRate: rated === 0 ? null : Math.round((success / rated) * 100),
  };
}

/**
 * Ringkasan feedback untuk BANYAK project sekaligus (dipakai halaman daftar
 * project). Satu query untuk semua project, bukan satu per kartu.
 */
export async function getFeedbackSummariesForProjects(
  projectIds: string[],
  userId: string,
): Promise<Map<string, FeedbackSummary>> {
  const summaries = new Map<string, FeedbackSummary>();
  if (projectIds.length === 0) return summaries;

  const rows = await db
    .select({
      projectId: tasks.projectId,
      taskId: taskFeedback.taskId,
      outcome: taskFeedback.outcome,
      createdAt: taskFeedback.createdAt,
    })
    .from(taskFeedback)
    .innerJoin(tasks, eq(tasks.id, taskFeedback.taskId))
    .innerJoin(projects, eq(projects.id, tasks.projectId))
    .where(and(inArray(tasks.projectId, projectIds), eq(projects.userId, userId)))
    .orderBy(desc(taskFeedback.createdAt));

  // Penilaian TERAKHIR per task, konsisten dengan getLatestFeedbackByTask.
  const seenTasks = new Set<string>();
  const tally = new Map<string, { success: number; failed: number }>();

  for (const row of rows) {
    if (seenTasks.has(row.taskId)) continue;
    seenTasks.add(row.taskId);

    const current = tally.get(row.projectId) ?? { success: 0, failed: 0 };
    if (row.outcome === "success") current.success += 1;
    else current.failed += 1;
    tally.set(row.projectId, current);
  }

  for (const projectId of projectIds) {
    const { success, failed } = tally.get(projectId) ?? { success: 0, failed: 0 };
    const rated = success + failed;
    summaries.set(projectId, {
      rated,
      success,
      failed,
      successRate: rated === 0 ? null : Math.round((success / rated) * 100),
    });
  }

  return summaries;
}

export async function listTaskFeedback(
  taskId: string,
  userId: string,
): Promise<TaskFeedback[]> {
  if (!(await ownsTask(taskId, userId))) return [];
  return db
    .select()
    .from(taskFeedback)
    .where(eq(taskFeedback.taskId, taskId))
    .orderBy(desc(taskFeedback.createdAt));
}

/** Jumlah task yang belum dinilai sama sekali — dipakai UI untuk mengingatkan. */
export async function countUnratedTasks(
  projectId: string,
  userId: string,
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(tasks)
    .innerJoin(projects, eq(projects.id, tasks.projectId))
    .where(
      and(
        eq(tasks.projectId, projectId),
        eq(projects.userId, userId),
        sql`not exists (select 1 from ${taskFeedback} where ${taskFeedback.taskId} = ${tasks.id})`,
      ),
    );
  return row?.count ?? 0;
}
