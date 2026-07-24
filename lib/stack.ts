/**
 * Pilihan tech stack untuk project. Dipakai UI (dropdown) dan validasi server.
 * Sengaja daftar terbuka: nilai bebas tetap diterima, daftar ini hanya saran.
 */
import { z } from "zod";

export const FRAMEWORK_OPTIONS = [
  "Next.js (App Router)",
  "Next.js (Pages Router)",
  "React + Vite",
  "Remix",
  "SvelteKit",
  "Nuxt",
  "Express",
  "FastAPI",
  "Laravel",
  "React Native (Expo)",
] as const;

export const LANGUAGE_OPTIONS = [
  "TypeScript",
  "JavaScript",
  "Python",
  "PHP",
  "Go",
  "Rust",
  "Dart",
] as const;

export const DATABASE_OPTIONS = [
  "Postgres (Supabase)",
  "Postgres (Neon)",
  "MySQL",
  "SQLite",
  "MongoDB",
  "Firebase Firestore",
  "Tanpa database",
] as const;

export const STYLING_OPTIONS = [
  "Tailwind CSS + shadcn/ui",
  "Tailwind CSS",
  "CSS Modules",
  "styled-components",
  "Chakra UI",
  "Tanpa framework CSS",
] as const;

export const techStackSchema = z.object({
  framework: z.string().min(1, "Framework wajib dipilih.").max(120),
  language: z.string().min(1, "Bahasa wajib dipilih.").max(120),
  database: z.string().min(1, "Database wajib dipilih.").max(120),
  styling: z.string().max(120).optional(),
  notes: z.string().max(500).optional(),
});

export const projectInputSchema = z.object({
  name: z.string().min(2, "Nama project minimal 2 karakter.").max(120),
  description: z.string().max(500).optional(),
  techStack: techStackSchema,
});

export type ProjectInput = z.infer<typeof projectInputSchema>;

/** Ringkasan stack satu baris — dipakai di prompt LLM & tampilan daftar. */
export function describeStack(stack: {
  framework?: string;
  language?: string;
  database?: string;
  styling?: string;
  notes?: string;
} | null): string {
  if (!stack) return "Stack belum ditentukan";
  const parts = [
    stack.framework,
    stack.language,
    stack.database,
    stack.styling,
  ].filter((part): part is string => Boolean(part));
  const base = parts.join(" · ");
  return stack.notes ? `${base} — ${stack.notes}` : base;
}
