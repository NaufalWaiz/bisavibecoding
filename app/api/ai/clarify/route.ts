import { z } from "zod";
import { streamText } from "@/lib/ai";
import {
  IDEA_CLARIFY_SYSTEM,
  buildIdeaClarifyPrompt,
} from "@/lib/ai/prompts/idea-clarify";
import { logGeneration } from "@/lib/db/queries/generations";
import {
  guardProject,
  readJson,
  readTier,
  serverError,
} from "@/app/api/_lib/route-helpers";

export const runtime = "nodejs";
// Streaming: jangan pernah di-cache.
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  projectId: z.string().min(1, "projectId wajib diisi."),
  idea: z.string().min(10, "Ceritakan idenya sedikit lebih panjang (min. 10 karakter)."),
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
      system: IDEA_CLARIFY_SYSTEM,
      prompt: buildIdeaClarifyPrompt({
        projectName: project.name,
        description: project.description,
        techStack: project.techStack,
        conversation: project.conversation,
        idea: body.data.idea,
      }),
      tier: readTier(body.data.tier),
      temperature: 0.6,
      maxOutputTokens: 800,
      onUsage: async (usage) => {
        try {
          await logGeneration({ projectId: project.id, usage });
        } catch (error) {
          // Pencatatan biaya tidak boleh menggagalkan respons ke user.
          console.error("[clarify] gagal mencatat generation", error);
        }
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
