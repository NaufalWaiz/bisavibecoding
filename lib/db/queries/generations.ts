import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { generations, projects, type Generation } from "@/lib/db/schema";
import type { UsageReport } from "@/lib/ai";

/**
 * Catat satu generasi LLM. Biaya sengaja belum dihitung dalam rupiah/dolar —
 * MVP hanya menyimpan token & slug model sebagai basis kredit ke depan.
 */
export async function logGeneration(input: {
  projectId: string;
  usage: UsageReport;
  cost?: number;
}): Promise<Generation | null> {
  const [row] = await db
    .insert(generations)
    .values({
      projectId: input.projectId,
      model: input.usage.model,
      promptTokens: input.usage.promptTokens,
      completionTokens: input.usage.completionTokens,
      cost: (input.cost ?? 0).toString(),
    })
    .returning();
  return row ?? null;
}

export async function listGenerations(
  projectId: string,
  userId: string,
): Promise<Generation[]> {
  return db
    .select({
      id: generations.id,
      projectId: generations.projectId,
      model: generations.model,
      promptTokens: generations.promptTokens,
      completionTokens: generations.completionTokens,
      cost: generations.cost,
      createdAt: generations.createdAt,
    })
    .from(generations)
    .innerJoin(projects, eq(projects.id, generations.projectId))
    .where(and(eq(generations.projectId, projectId), eq(projects.userId, userId)));
}
