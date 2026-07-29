import { z } from "zod";
import { describeAiError, generateJson } from "@/lib/ai";
import { TASKS_SYSTEM, buildTasksPrompt } from "@/lib/ai/prompts/tasks";
import {
  TaskValidationError,
  parseTaskListWithRetry,
  type TaskOutput,
} from "@/lib/ai/schemas/tasks";
import { checkTaskListConsistency } from "@/lib/ai/consistency";
import { getDocumentByType } from "@/lib/db/queries/documents";
import { logGeneration } from "@/lib/db/queries/generations";
import {
  listStaleTasks,
  listTasks,
  replaceStaleTasks,
  replaceTasks,
  type TaskDraft,
} from "@/lib/db/queries/tasks";
import {
  errorResponse,
  guardProject,
  readJson,
  readTier,
} from "@/app/api/_lib/route-helpers";
import type { UsageReport } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const bodySchema = z.object({
  projectId: z.string().min(1, "projectId wajib diisi."),
  /** `stale` hanya membuat ulang task yang sudah ketinggalan versi PRD (T3.2). */
  mode: z.enum(["all", "stale"]).optional(),
  tier: z.unknown().optional(),
});

/** Ubah output LLM (snake_case) jadi bentuk yang dipakai lapisan data. */
function toDraft(task: TaskOutput, warnings: string[]): TaskDraft {
  return {
    title: task.title,
    goal: task.goal,
    filesTouched: task.files_touched,
    contextSlice: task.context_slice,
    acceptanceCriteria: task.acceptance_criteria,
    finalPrompt: task.final_prompt,
    consistencyWarnings: warnings,
  };
}

export async function POST(request: Request) {
  const body = await readJson(request, bodySchema);
  if (!body.ok) return body.response;

  const guard = await guardProject(body.data.projectId);
  if (!guard.ok) return guard.response;

  const { project, userId } = guard;
  const mode = body.data.mode ?? "all";
  const tier = readTier(body.data.tier);

  const prd = await getDocumentByType(project.id, userId, "prd");
  if (!prd) {
    return errorResponse("Belum ada PRD untuk project ini.", 409);
  }
  if (prd.status !== "locked") {
    return errorResponse(
      "Task hanya boleh dibuat dari PRD yang sudah dikunci. Kunci PRD-nya dulu.",
      409,
    );
  }

  try {
    // Mode `stale`: kumpulkan task yang perlu dibuat ulang beserta pasangannya.
    const staleTasks = mode === "stale" ? await listStaleTasks(project.id, userId) : [];
    if (mode === "stale" && staleTasks.length === 0) {
      return Response.json({ tasks: [], regenerated: 0, message: "Tidak ada task stale." });
    }

    const allTasks = mode === "stale" ? await listTasks(project.id, userId) : [];
    const staleIds = new Set(staleTasks.map((task) => task.id));
    const keepUntouched = allTasks.filter((task) => !staleIds.has(task.id));

    let usage: UsageReport | null = null;

    const result = await parseTaskListWithRetry(async (feedback) => {
      const generated = await generateJson({
        system: TASKS_SYSTEM,
        prompt: buildTasksPrompt({
          projectName: project.name,
          techStack: project.techStack,
          prdContent: prd.content,
          regenerateOnly:
            mode === "stale"
              ? staleTasks.map((task) => ({ title: task.title, goal: task.goal }))
              : undefined,
          keepUntouched:
            mode === "stale"
              ? keepUntouched.map((task) => ({ title: task.title, goal: task.goal }))
              : undefined,
          feedback,
        }),
        tier,
        temperature: 0.3,
      });
      usage = generated.usage;
      return generated.data;
    }, mode === "stale" ? { expectedCount: staleTasks.length } : {});

    // Konsistensi checker (T3.3) — non-blocking, hasilnya disimpan per task.
    const reports = checkTaskListConsistency(result.tasks, prd.content);

    if (mode === "stale") {
      // Pasangkan hasil dengan task stale sesuai urutan yang diminta di prompt.
      const replacements = staleTasks
        .map((task, index) =>
          result.tasks[index]
            ? {
                taskId: task.id,
                draft: toDraft(result.tasks[index], reports[index]?.warnings ?? []),
              }
            : null,
        )
        .filter((item): item is { taskId: string; draft: TaskDraft } => item !== null);

      const regenerated = await replaceStaleTasks({
        projectId: project.id,
        userId,
        sourceDocumentId: prd.id,
        sourceDocumentVersion: prd.version,
        replacements,
      });

      if (usage) {
        try {
          await logGeneration({ projectId: project.id, usage });
        } catch (error) {
          console.error("[tasks] gagal mencatat generation", error);
        }
      }

      // Hitung ulang, jangan diasumsikan. Kalau masih ada yang stale, user
      // berhak tahu sekarang juga — bukan menemukannya sendiri nanti setelah
      // diberi tahu operasinya "berhasil".
      const remainingStale = (await listStaleTasks(project.id, userId)).length;

      return Response.json({
        regenerated,
        remainingStale,
        sourceDocumentVersion: prd.version,
        mode,
      });
    }

    const saved = await replaceTasks({
      projectId: project.id,
      userId,
      sourceDocumentId: prd.id,
      sourceDocumentVersion: prd.version,
      drafts: result.tasks.map((task, index) =>
        toDraft(task, reports[index]?.warnings ?? []),
      ),
    });

    if (usage) {
      try {
        await logGeneration({ projectId: project.id, usage });
      } catch (error) {
        console.error("[tasks] gagal mencatat generation", error);
      }
    }

    return Response.json({
      count: saved.length,
      sourceDocumentVersion: prd.version,
      mode,
    });
  } catch (error) {
    if (error instanceof TaskValidationError) {
      return errorResponse(
        `Model gagal menghasilkan task yang valid: ${error.issues.slice(0, 3).join("; ")}`,
        502,
      );
    }
    // Alasan dari gateway (slug tidak ada, kredit kurang, host salah) jauh lebih
    // berguna bagi user daripada pesan generik.
    console.error("[tasks] generasi gagal:", error);
    return errorResponse(describeAiError(error), 502);
  }
}
