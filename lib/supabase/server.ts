/**
 * Client Supabase untuk konteks server (Server Component, Route Handler, Server
 * Action). Sesi dibaca/ditulis lewat cookie Next.
 */
import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { publicEnv, serverEnv } from "@/lib/env";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    publicEnv.supabaseUrl(),
    publicEnv.supabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Dipanggil dari Server Component: penulisan cookie ditangani
            // middleware. Aman diabaikan.
          }
        },
      },
    },
  );
}

/**
 * Client service-role: melewati RLS. Dipakai hanya untuk operasi sistem
 * (mis. membuat baris `profiles` saat user pertama kali daftar).
 * JANGAN pernah diimpor dari Client Component.
 */
export function createAdminClient() {
  return createSupabaseClient(
    publicEnv.supabaseUrl(),
    serverEnv.supabaseServiceRoleKey(),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

/** Ambil user yang sedang login, atau `null`. */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Ambil user yang sedang login; lempar kalau tidak ada (untuk route handler). */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
