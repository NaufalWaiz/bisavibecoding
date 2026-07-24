/**
 * Koneksi Drizzle ke Postgres (Supabase).
 *
 * Hanya dipakai di server. Semua akses DB melalui `lib/db/queries/*`, jangan
 * mengimpor `db` langsung dari route/komponen.
 */
import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { serverEnv } from "@/lib/env";
import * as schema from "./schema";

declare global {
  var __arsitekPg: ReturnType<typeof postgres> | undefined;
}

function createConnection() {
  return postgres(serverEnv.databaseUrl(), {
    // Wajib untuk connection pooler Supabase (transaction mode): pooler tidak
    // menjamin query berikutnya jatuh ke koneksi backend yang sama.
    prepare: false,

    // Pooler Supabase memutus koneksi yang menganggur. Kalau postgres.js tetap
    // memegang socket itu (default-nya: selamanya), query berikutnya menabrak
    // socket mati → `read ECONNRESET`. Daur ulang lebih dulu daripada diputus.
    idle_timeout: 20,
    max_lifetime: 60 * 30,
    max: 10,
    connect_timeout: 15,
  });
}

// Di dev, Next me-reload modul tiap perubahan; cache koneksi agar tidak bocor.
const client = globalThis.__arsitekPg ?? createConnection();
if (process.env.NODE_ENV !== "production") {
  globalThis.__arsitekPg = client;
}

export const db = drizzle(client, { schema });
export { schema };
