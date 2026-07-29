import "server-only";

import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  documents,
  projects,
  tasks,
  type ContextSlice,
  type Task,
  type TaskStatus,
} from "@/lib/db/schema";

/** Pastikan project ini milik user (koneksi Drizzle tidak terikat RLS — D-008). */
async function ownsProject(projectId: string, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  return Boolean(row);
}

export type TaskDraft = {
  title: string;
  goal: string;
  filesTouched: string[];
  contextSlice: ContextSlice;
  acceptanceCriteria: string[];
  finalPrompt: string;
  consistencyWarnings?: string[];
};

/**
 * Hitung ulang penanda stale untuk seluruh task project.
 *
 * Task stale bila `documents.version > tasks.source_document_version`
 * (ARCHITECTURE §5). Dihitung ulang tiap kali daftar task dimuat atau PRD
 * di-lock ulang, jadi kolom `is_stale` hanyalah cache dari perbandingan itu.
 *
 * Sengaja DUA arah. Versi sebelumnya hanya pernah menyalakan `is_stale` dan
 * tidak pernah mematikannya, sehingga kolomnya bukan lagi cache melainkan
 * catatan permanen: sekali sebuah baris salah bernilai `true` (mis. regenerate
 * yang gagal separuh jalan), badge "stale" menempel selamanya walaupun versi
 * sumbernya sudah sama dengan PRD.
 */
export async function markStaleTasks(
  projectId: string,
  userId: string,
): Promise<number> {
  if (!(await ownsProject(projectId, userId))) return 0;

  const rows = await db
    .select({
      id: tasks.id,
      isStale: tasks.isStale,
      shouldBeStale: sql<boolean>`${tasks.sourceDocumentVersion} < ${documents.version}`,
    })
    .from(tasks)
    .innerJoin(documents, eq(documents.id, tasks.sourceDocumentId))
    .where(eq(tasks.projectId, projectId));

  const turnOn = rows.filter((row) => row.shouldBeStale && !row.isStale);
  const turnOff = rows.filter((row) => !row.shouldBeStale && row.isStale);

  if (turnOn.length > 0) {
    await db
      .update(tasks)
      .set({ isStale: true })
      .where(
        inArray(
          tasks.id,
          turnOn.map((row) => row.id),
        ),
      );
  }

  if (turnOff.length > 0) {
    await db
      .update(tasks)
      .set({ isStale: false })
      .where(
        inArray(
          tasks.id,
          turnOff.map((row) => row.id),
        ),
      );
  }

  return rows.filter((row) => row.shouldBeStale).length;
}

export async function listTasks(
  projectId: string,
  userId: string,
): Promise<Task[]> {
  if (!(await ownsProject(projectId, userId))) return [];
  // Segarkan penanda stale sebelum menampilkan (T3.1).
  await markStaleTasks(projectId, userId);

  return db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(asc(tasks.orderIndex), asc(tasks.createdAt));
}

export async function getTask(
  taskId: string,
  userId: string,
): Promise<Task | null> {
  const [row] = await db
    .select({ task: tasks })
    .from(tasks)
    .innerJoin(projects, eq(projects.id, tasks.projectId))
    .where(and(eq(tasks.id, taskId), eq(projects.userId, userId)))
    .limit(1);
  return row?.task ?? null;
}

/** Ganti seluruh daftar task project dengan hasil generasi baru. */
export async function replaceTasks(input: {
  projectId: string;
  userId: string;
  sourceDocumentId: string;
  sourceDocumentVersion: number;
  drafts: TaskDraft[];
}): Promise<Task[]> {
  if (!(await ownsProject(input.projectId, input.userId))) return [];

  return db.transaction(async (tx) => {
    await tx.delete(tasks).where(eq(tasks.projectId, input.projectId));
    if (input.drafts.length === 0) return [];

    return tx
      .insert(tasks)
      .values(
        input.drafts.map((draft, index) => ({
          projectId: input.projectId,
          sourceDocumentId: input.sourceDocumentId,
          sourceDocumentVersion: input.sourceDocumentVersion,
          title: draft.title,
          goal: draft.goal,
          filesTouched: draft.filesTouched,
          contextSlice: draft.contextSlice,
          acceptanceCriteria: draft.acceptanceCriteria,
          finalPrompt: draft.finalPrompt,
          orderIndex: index,
          isStale: false,
          consistencyWarnings: draft.consistencyWarnings ?? [],
        })),
      )
      .returning();
  });
}

/**
 * Ganti HANYA task yang stale (T3.2), pertahankan urutan & task lain apa adanya.
 * `drafts` harus sepanjang `staleTaskIds` dan berurutan sama.
 */
export async function replaceStaleTasks(input: {
  projectId: string;
  userId: string;
  sourceDocumentId: string;
  sourceDocumentVersion: number;
  replacements: { taskId: string; draft: TaskDraft }[];
}): Promise<number> {
  if (!(await ownsProject(input.projectId, input.userId))) return 0;
  if (input.replacements.length === 0) return 0;

  return db.transaction(async (tx) => {
    let updated = 0;
    for (const { taskId, draft } of input.replacements) {
      const rows = await tx
        .update(tasks)
        .set({
          title: draft.title,
          goal: draft.goal,
          filesTouched: draft.filesTouched,
          contextSlice: draft.contextSlice,
          acceptanceCriteria: draft.acceptanceCriteria,
          finalPrompt: draft.finalPrompt,
          consistencyWarnings: draft.consistencyWarnings ?? [],
          sourceDocumentId: input.sourceDocumentId,
          sourceDocumentVersion: input.sourceDocumentVersion,
          isStale: false,
        })
        .where(and(eq(tasks.id, taskId), eq(tasks.projectId, input.projectId)))
        .returning({ id: tasks.id });
      updated += rows.length;
    }
    return updated;
  });
}

export async function updateTaskStatus(
  taskId: string,
  userId: string,
  status: TaskStatus,
): Promise<Task | null> {
  const owned = await getTask(taskId, userId);
  if (!owned) return null;

  const [row] = await db
    .update(tasks)
    .set({ status })
    .where(eq(tasks.id, taskId))
    .returning();
  return row ?? null;
}

export async function listStaleTasks(
  projectId: string,
  userId: string,
): Promise<Task[]> {
  if (!(await ownsProject(projectId, userId))) return [];
  await markStaleTasks(projectId, userId);
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), eq(tasks.isStale, true)))
    .orderBy(asc(tasks.orderIndex));
}

export async function setConsistencyWarnings(
  taskId: string,
  warnings: string[],
): Promise<void> {
  await db
    .update(tasks)
    .set({ consistencyWarnings: warnings })
    .where(eq(tasks.id, taskId));
}

/** Ringkasan status task per project — dipakai halaman daftar & metrik. */
export async function countTasksByStatus(
  projectId: string,
  userId: string,
): Promise<Record<TaskStatus, number>> {
  const empty: Record<TaskStatus, number> = {
    todo: 0,
    in_progress: 0,
    done: 0,
    failed: 0,
  };
  if (!(await ownsProject(projectId, userId))) return empty;

  const rows = await db
    .select({ status: tasks.status, count: sql<number>`count(*)::int` })
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .groupBy(tasks.status);

  for (const row of rows) empty[row.status] = row.count;
  return empty;
}
