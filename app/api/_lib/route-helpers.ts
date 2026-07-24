import "server-only";

import { NextResponse } from "next/server";
import type { z } from "zod";
import { getCurrentUser } from "@/lib/supabase/server";
import { getProject } from "@/lib/db/queries/projects";
import type { Project } from "@/lib/db/schema";
import { isModelTier, type ModelTier } from "@/lib/ai/models";

/** Jawaban error seragam untuk semua route AI. */
export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export type Guard =
  | { ok: true; userId: string; project: Project }
  | { ok: false; response: NextResponse };

/**
 * Verifikasi sesi + kepemilikan project. Semua route handler AI memakai ini
 * sebelum menyentuh LLM (ARCHITECTURE §7).
 */
export async function guardProject(projectId: unknown): Promise<Guard> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, response: errorResponse("Belum login.", 401) };
  }
  if (typeof projectId !== "string" || !projectId) {
    return { ok: false, response: errorResponse("projectId wajib diisi.", 400) };
  }

  const project = await getProject(projectId, user.id);
  if (!project) {
    return { ok: false, response: errorResponse("Project tidak ditemukan.", 404) };
  }

  return { ok: true, userId: user.id, project };
}

/** Baca `tier` dari body request; jatuh ke `default` kalau tidak dikenal. */
export function readTier(value: unknown): ModelTier {
  return isModelTier(value) ? value : "default";
}

/** Parse body JSON dengan Zod; kembalikan response error kalau gagal. */
export async function readJson<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, response: errorResponse("Body harus JSON.", 400) };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      response: errorResponse(
        parsed.error.issues[0]?.message ?? "Body tidak valid.",
        400,
      ),
    };
  }
  return { ok: true, data: parsed.data };
}

/** Ubah error apa pun menjadi response 500 tanpa membocorkan detail internal. */
export function serverError(error: unknown) {
  console.error("[api]", error);
  return errorResponse(
    "Generasi gagal. Coba lagi sebentar lagi.",
    500,
  );
}
