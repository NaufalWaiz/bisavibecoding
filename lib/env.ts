/**
 * Akses env terpusat.
 *
 * Dibaca *lazy* (fungsi, bukan konstanta modul) supaya `next build` tidak gagal
 * hanya karena env belum lengkap di mesin build. Yang penting: variabel rahasia
 * hanya pernah dibaca dari kode server.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Env \`${name}\` belum di-set. Salin \`.env.example\` ke \`.env.local\` dan isi.`,
    );
  }
  return value;
}

/** Env yang aman dipakai di browser (di-inline Next lewat prefix NEXT_PUBLIC_). */
export const publicEnv = {
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
};

/** Env rahasia — jangan pernah diimpor dari Client Component. */
export const serverEnv = {
  supabaseServiceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),
  databaseUrl: () => required("DATABASE_URL"),
  limitRouterApiKey: () => required("LIMITROUTER_API_KEY"),
  limitRouterBaseUrl: () => required("LIMITROUTER_BASE_URL"),
  aiModelDefault: () => required("AI_MODEL_DEFAULT"),
  aiModelPremium: () => required("AI_MODEL_PREMIUM"),
};
