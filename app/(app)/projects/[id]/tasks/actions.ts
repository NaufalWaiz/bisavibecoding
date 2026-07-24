"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/server";
import { updateTaskStatus } from "@/lib/db/queries/tasks";
import { addTaskFeedback } from "@/lib/db/queries/task_feedback";
import type { FeedbackOutcome, TaskStatus } from "@/lib/db/schema";

const VALID_STATUSES: TaskStatus[] = ["todo", "in_progress", "done", "failed"];

export async function updateTaskStatusAction(
  projectId: string,
  taskId: string,
  status: string,
): Promise<{ error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Belum login." };
  if (!VALID_STATUSES.includes(status as TaskStatus))
    return { error: "Status tidak dikenal." };

  const updated = await updateTaskStatus(taskId, user.id, status as TaskStatus);
  if (!updated) return { error: "Task tidak ditemukan." };

  revalidatePath(`/projects/${projectId}/tasks`);
  return { error: null };
}

/**
 * Catat hasil pemakaian prompt sebuah task.
 *
 * Ini metrik utama produk ("sekali jalan benar"), jadi outcome disimpan sebagai
 * baris baru — riwayat penilaian ikut tersimpan, yang dihitung yang terakhir.
 */
export async function submitTaskFeedbackAction(
  projectId: string,
  taskId: string,
  outcome: string,
  notes: string,
): Promise<{ error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Belum login." };
  if (outcome !== "success" && outcome !== "failed")
    return { error: "Outcome harus success atau failed." };

  const saved = await addTaskFeedback({
    taskId,
    userId: user.id,
    outcome: outcome as FeedbackOutcome,
    notes,
  });
  if (!saved) return { error: "Task tidak ditemukan." };

  revalidatePath(`/projects/${projectId}/tasks`);
  return { error: null };
}
