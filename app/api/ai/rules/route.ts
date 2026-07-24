import { z } from "zod";
import { streamText } from "@/lib/ai";
import {
  buildRulesFilePrompt,
  rulesFileSystem,
} from "@/lib/ai/prompts/rules-file";
import { getDocumentByType } from "@/lib/db/queries/documents";
import { logGeneration } from "@/lib/db/queries/generations";
import {
  errorResponse,
  guardProject,
  readJson,
  readTier,
  serverError,
} from "@/app/api/_lib/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  projectId: z.string().min(1, "projectId wajib diisi."),
  kind: z.enum(["claude", "cursor"]),
  tier: z.unknown().optional(),
});

export async function POST(request: Request) {
  const body = await readJson(request, bodySchema);
  if (!body.ok) return body.response;

  const guard = await guardProject(body.data.projectId);
  if (!guard.ok) return guard.response;

  const { project, userId } = guard;

  const prd = await getDocumentByType(project.id, userId, "prd");
  if (!prd || prd.content.trim().length === 0) {
    return errorResponse(
      "Belum ada PRD. File aturan diturunkan dari PRD + stack.",
      409,
    );
  }

  try {
    return streamText({
      system: rulesFileSystem(body.data.kind),
      prompt: buildRulesFilePrompt({
        kind: body.data.kind,
        projectName: project.name,
        description: project.description,
        techStack: project.techStack,
        prdContent: prd.content,
      }),
      tier: readTier(body.data.tier),
      temperature: 0.4,
      maxOutputTokens: 4000,
      onUsage: async (usage) => {
        try {
          await logGeneration({ projectId: project.id, usage });
        } catch (error) {
          console.error("[rules] gagal mencatat generation", error);
        }
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
