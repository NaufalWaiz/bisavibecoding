"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/db/queries/profiles";
import {
  createProject,
  deleteProject as deleteProjectQuery,
} from "@/lib/db/queries/projects";
import { projectInputSchema } from "@/lib/stack";

export type ProjectFormState = { error: string | null };

export async function createProjectAction(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = projectInputSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || undefined,
    techStack: {
      framework: String(formData.get("framework") ?? "").trim(),
      language: String(formData.get("language") ?? "").trim(),
      database: String(formData.get("database") ?? "").trim(),
      styling: String(formData.get("styling") ?? "").trim() || undefined,
      notes: String(formData.get("notes") ?? "").trim() || undefined,
    },
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid." };
  }

  let projectId: string;
  try {
    // FK projects.user_id → profiles.id: pastikan profile ada dulu.
    await ensureProfile(user.id, user.email ?? "");
    const project = await createProject({ userId: user.id, ...parsed.data });
    projectId = project.id;
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? `Gagal menyimpan project: ${error.message}`
          : "Gagal menyimpan project.",
    };
  }

  revalidatePath("/projects");
  redirect(`/projects/${projectId}`);
}

export async function deleteProjectAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) return;

  await deleteProjectQuery(projectId, user.id);
  revalidatePath("/projects");
  redirect("/projects");
}
