import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  documents,
  projects,
  tasks,
  type ConversationTurn,
  type Project,
  type TechStack,
} from "@/lib/db/schema";
import { getFeedbackSummariesForProjects } from "@/lib/db/queries/task_feedback";

/**
 * Semua fungsi di sini menerima `userId` dan menyaring kepemilikan secara
 * eksplisit. RLS Supabase tetap aktif sebagai lapis kedua, tapi koneksi Drizzle
 * memakai role owner sehingga tidak terikat RLS — lihat DECISIONS D-008.
 */

export async function listProjects(userId: string): Promise<Project[]> {
  return db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.updatedAt));
}

export type ProjectSummary = Project & {
  prdStatus: "locked" | "draft" | null;
  prdVersion: number | null;
  taskCount: number;
  staleCount: number;
  /** Jumlah task yang sudah dinilai user (T3.4). */
  ratedCount: number;
  /** % task yang "sekali jalan benar"; `null` kalau belum ada yang dinilai. */
  successRate: number | null;
};

export async function listProjectsWithSummary(
  userId: string,
): Promise<ProjectSummary[]> {
  const userProjects = await listProjects(userId);
  if (userProjects.length === 0) return [];

  // Parallel fetch for documents & tasks summary
  const projectIds = userProjects.map((p) => p.id);

  const [allDocs, allTasks, feedbackSummaries] = await Promise.all([
    db
      .select({
        projectId: documents.projectId,
        status: documents.status,
        version: documents.version,
      })
      .from(documents)
      .where(and(eq(documents.type, "prd"), inArray(documents.projectId, projectIds))),
    db
      .select({
        projectId: tasks.projectId,
        isStale: tasks.isStale,
      })
      .from(tasks)
      .where(inArray(tasks.projectId, projectIds)),
    getFeedbackSummariesForProjects(projectIds, userId),
  ]);

  const docMap = new Map(allDocs.map((d) => [d.projectId, d]));

  const taskMap = new Map<string, { total: number; stale: number }>();
  for (const t of allTasks) {
    const cur = taskMap.get(t.projectId) ?? { total: 0, stale: 0 };
    cur.total += 1;
    if (t.isStale) cur.stale += 1;
    taskMap.set(t.projectId, cur);
  }

  return userProjects.map((p) => {
    const doc = docMap.get(p.id);
    const t = taskMap.get(p.id) ?? { total: 0, stale: 0 };
    const feedback = feedbackSummaries.get(p.id);
    return {
      ...p,
      prdStatus: doc ? doc.status : null,
      prdVersion: doc ? doc.version : null,
      taskCount: t.total,
      staleCount: t.stale,
      ratedCount: feedback?.rated ?? 0,
      successRate: feedback?.successRate ?? null,
    };
  });
}

export async function getProject(
  projectId: string,
  userId: string,
): Promise<Project | null> {
  const [row] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function createProject(input: {
  userId: string;
  name: string;
  description?: string | null;
  techStack: TechStack;
}): Promise<Project> {
  const [row] = await db
    .insert(projects)
    .values({
      userId: input.userId,
      name: input.name,
      description: input.description ?? null,
      techStack: input.techStack,
    })
    .returning();
  return row;
}

/** Hapus project. Dokumen, task, feedback & generations ikut terhapus (cascade). */
export async function deleteProject(
  projectId: string,
  userId: string,
): Promise<boolean> {
  const deleted = await db
    .delete(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .returning({ id: projects.id });
  return deleted.length > 0;
}

export async function updateProject(
  projectId: string,
  userId: string,
  patch: Partial<Pick<Project, "name" | "description" | "techStack" | "status">>,
): Promise<Project | null> {
  const [row] = await db
    .update(projects)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .returning();
  return row ?? null;
}

/** Simpan transkrip percakapan intake ide (T1.3). */
export async function saveConversation(
  projectId: string,
  userId: string,
  conversation: ConversationTurn[],
): Promise<Project | null> {
  const [row] = await db
    .update(projects)
    .set({ conversation, updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .returning();
  return row ?? null;
}
