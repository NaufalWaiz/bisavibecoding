import { z } from "zod";
import { streamText } from "@/lib/ai";
import { PRD_SYSTEM, buildPrdPrompt } from "@/lib/ai/prompts/prd";
import { logGeneration } from "@/lib/db/queries/generations";
import { upsertDocument } from "@/lib/db/queries/documents";
import {
  guardProject,
  readJson,
  readTier,
  serverError,
} from "@/app/api/_lib/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  projectId: z.string().min(1, "projectId wajib diisi."),
  tier: z.unknown().optional(),
});

export async function POST(request: Request) {
  const body = await readJson(request, bodySchema);
  if (!body.ok) return body.response;

  const guard = await guardProject(body.data.projectId);
  if (!guard.ok) return guard.response;

  const { project } = guard;

  try {
    return streamText({
      system: PRD_SYSTEM,
      prompt: buildPrdPrompt({
        projectName: project.name,
        description: project.description,
        techStack: project.techStack,
        conversation: project.conversation ?? [],
      }),
      tier: readTier(body.data.tier),
      temperature: 0.5,
      maxOutputTokens: 6000,
      onUsage: async (usage) => {
        try {
          await logGeneration({ projectId: project.id, usage });
        } catch (error) {
          console.error("[prd] gagal mencatat generation", error);
        }
      },
    });
  } catch (error) {
    return serverError(error);
  }
}

/**
 * Simpan hasil generasi PRD. Dipanggil client setelah stream selesai supaya
 * teks yang tersimpan persis dengan yang dilihat user.
 */
const saveSchema = z.object({
  projectId: z.string().min(1),
  content: z.string().min(1, "Isi PRD kosong."),
});

export async function PUT(request: Request) {
  const body = await readJson(request, saveSchema);
  if (!body.ok) return body.response;

  const guard = await guardProject(body.data.projectId);
  if (!guard.ok) return guard.response;

  try {
    const document = await upsertDocument({
      projectId: guard.project.id,
      userId: guard.userId,
      content: body.data.content,
    });
    if (!document) return serverError(new Error("upsertDocument mengembalikan null"));
    return Response.json({ documentId: document.id, version: document.version });
  } catch (error) {
    return serverError(error);
  }
}
