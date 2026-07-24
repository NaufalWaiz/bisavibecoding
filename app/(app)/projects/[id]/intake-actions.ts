"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/server";
import { getProject, saveConversation } from "@/lib/db/queries/projects";
import type { ConversationTurn } from "@/lib/db/schema";

/**
 * Simpan transkrip percakapan intake ide.
 *
 * Transkrip disimpan utuh (bukan ditambah per giliran) supaya UI tetap jadi
 * sumber urutan yang benar saat streaming berlangsung di client.
 */
export async function saveConversationAction(
  projectId: string,
  conversation: ConversationTurn[],
): Promise<{ error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Belum login." };

  const project = await getProject(projectId, user.id);
  if (!project) return { error: "Project tidak ditemukan." };

  const cleaned: ConversationTurn[] = conversation
    .filter(
      (turn) =>
        (turn.role === "user" || turn.role === "assistant") &&
        typeof turn.content === "string" &&
        turn.content.trim().length > 0,
    )
    .map((turn) => ({ role: turn.role, content: turn.content.trim() }));

  await saveConversation(projectId, user.id, cleaned);
  revalidatePath(`/projects/${projectId}`);
  return { error: null };
}

export async function resetConversationAction(projectId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Belum login." };
  await saveConversation(projectId, user.id, []);
  revalidatePath(`/projects/${projectId}`);
  return { error: null };
}
