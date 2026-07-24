import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

// `.env.local` adalah konvensi Next; drizzle-kit tidak membacanya sendiri.
loadEnv({ path: ".env.local", override: true });

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Migrasi berisi DDL; transaction pooler (6543) tidak cocok untuk itu.
    // Pakai session pooler kalau tersedia, jatuh ke DATABASE_URL kalau tidak.
    url: process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL ?? "",
  },
  verbose: true,
  strict: true,
});
