"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/server";
import { getProject } from "@/lib/db/queries/projects";
import {
  lockDocument,
  updateDocumentContent,
  upsertDocument,
} from "@/lib/db/queries/documents";
import { markStaleTasks } from "@/lib/db/queries/tasks";

export type PrdActionState = {
  error: string | null;
  message: string | null;
  /** Versi dokumen setelah aksi — dipakai UI untuk menyegarkan badge. */
  version?: number;
  documentId?: string;
};

export async function savePrdAction(
  projectId: string,
  content: string,
): Promise<PrdActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Belum login.", message: null };
  if (content.trim().length === 0)
    return { error: "PRD tidak boleh kosong.", message: null };

  const project = await getProject(projectId, user.id);
  if (!project) return { error: "Project tidak ditemukan.", message: null };

  const document = await upsertDocument({
    projectId,
    userId: user.id,
    content,
  });
  if (!document) return { error: "Gagal menyimpan PRD.", message: null };

  revalidatePath(`/projects/${projectId}/prd`);
  return {
    error: null,
    message: "PRD tersimpan sebagai draft.",
    version: document.version,
    documentId: document.id,
  };
}

export async function lockPrdAction(
  projectId: string,
  documentId: string,
): Promise<PrdActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Belum login.", message: null };

  const document = await lockDocument(documentId, user.id);
  if (!document)
    return { error: "Gagal mengunci PRD (kosong atau bukan milikmu).", message: null };

  // Versi baru → task turunan dari versi lama otomatis jadi stale (T3.1).
  await markStaleTasks(projectId, user.id);

  revalidatePath(`/projects/${projectId}/prd`);
  revalidatePath(`/projects/${projectId}/tasks`);
  return {
    error: null,
    message: `PRD dikunci pada versi ${document.version}.`,
    version: document.version,
    documentId: document.id,
  };
}

/** Edit setelah lock: kembalikan ke draft agar bisa di-lock ulang (versi naik). */
export async function unlockPrdAction(
  projectId: string,
  documentId: string,
  content: string,
): Promise<PrdActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Belum login.", message: null };

  const document = await updateDocumentContent(documentId, user.id, content);
  if (!document) return { error: "Gagal menyimpan perubahan.", message: null };

  revalidatePath(`/projects/${projectId}/prd`);
  return {
    error: null,
    message: "Perubahan tersimpan sebagai draft. Kunci lagi untuk menaikkan versi.",
    version: document.version,
    documentId: document.id,
  };
}
