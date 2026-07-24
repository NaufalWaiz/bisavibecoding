/**
 * Sumber tunggal slug model LLM.
 *
 * Semua model diakses lewat LimitRouter (gateway OpenAI-compatible). Kita tidak
 * berganti SDK provider untuk "multi-model" — cukup mengganti slug model yang
 * dikirim ke gateway. Slug dibaca dari env agar bisa di-tuning tanpa deploy ulang
 * kode, dan supaya tidak ada slug ter-hardcode tersebar di route/komponen.
 *
 * Integrasi LimitRouter sengaja diisolasi di `lib/ai/` — file ini bagian dari
 * batas itu.
 */

import { serverEnv } from "@/lib/env";

/** Tingkat model yang dikenal aplikasi. Route/komponen hanya bicara dalam `tier`. */
export type ModelTier = "default" | "premium";

export const MODEL_TIERS: readonly ModelTier[] = ["default", "premium"] as const;

export function isModelTier(value: unknown): value is ModelTier {
  return value === "default" || value === "premium";
}

/**
 * Petakan `tier` ke slug model LimitRouter.
 *
 * - `default`  → generasi harian (biaya lebih rendah).
 * - `premium`  → generasi yang butuh kualitas/penalaran lebih tinggi.
 *
 * Dibaca lazy dari env agar build tidak gagal saat env belum lengkap.
 */
export function resolveModel(tier: ModelTier = "default"): string {
  return tier === "premium"
    ? serverEnv.aiModelPremium()
    : serverEnv.aiModelDefault();
}
