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

export interface StackPreset {
  id: string;
  name: string;
  tagline: string;
  category: string;
  badge?: string;
  popular?: boolean;
  framework: (typeof FRAMEWORK_OPTIONS)[number];
  language: (typeof LANGUAGE_OPTIONS)[number];
  database: (typeof DATABASE_OPTIONS)[number];
  styling: (typeof STYLING_OPTIONS)[number];
}

export const STACK_PRESETS: readonly StackPreset[] = [
  {
    id: "next-saas",
    name: "Next.js Fullstack SaaS",
    tagline: "App Router modern dengan Supabase Auth & DB, serta UI Tailwind + shadcn.",
    category: "Web SaaS",
    badge: "Rekomendasi Utama",
    popular: true,
    framework: "Next.js (App Router)",
    language: "TypeScript",
    database: "Postgres (Supabase)",
    styling: "Tailwind CSS + shadcn/ui",
  },
  {
    id: "vite-react",
    name: "Vite React SPA",
    tagline: "Single Page Application ultra cepat bertenaga Vite bundler & Tailwind CSS.",
    category: "Frontend SPA",
    badge: "High Performance",
    framework: "React + Vite",
    language: "TypeScript",
    database: "Postgres (Supabase)",
    styling: "Tailwind CSS",
  },
  {
    id: "express-api",
    name: "Express Node API",
    tagline: "Backend REST API TypeScript bertenaga yang terhubung ke Neon Postgres.",
    category: "Backend API",
    badge: "REST & Microservice",
    framework: "Express",
    language: "TypeScript",
    database: "Postgres (Neon)",
    styling: "Tanpa framework CSS",
  },
  {
    id: "fastapi-ai",
    name: "FastAPI AI Microservice",
    tagline: "Microservice Python performa tinggi untuk integrasi AI & Machine Learning.",
    category: "AI & Data",
    badge: "Python Async",
    framework: "FastAPI",
    language: "Python",
    database: "Postgres (Supabase)",
    styling: "Tanpa framework CSS",
  },
  {
    id: "laravel-fullstack",
    name: "Laravel Monolith",
    tagline: "Arsitektur web monolitik enterprise dengan ORM Eloquent & MySQL DB.",
    category: "Enterprise Web",
    badge: "PHP Ecosystem",
    framework: "Laravel",
    language: "PHP",
    database: "MySQL",
    styling: "Tailwind CSS",
  },
  {
    id: "expo-mobile",
    name: "Expo Mobile App",
    tagline: "Aplikasi mobile native iOS & Android bertenaga React Native & Firestore.",
    category: "Mobile Native",
    badge: "Cross-Platform",
    framework: "React Native (Expo)",
    language: "TypeScript",
    database: "Firebase Firestore",
    styling: "Tanpa framework CSS",
  },
] as const;

export function findMatchingPreset(
  framework: string,
  language: string,
  database: string,
  styling: string
): StackPreset | null {
  return (
    STACK_PRESETS.find(
      (p) =>
        p.framework === framework &&
        p.language === language &&
        p.database === database &&
        (p.styling === styling || (p.styling === "Tanpa framework CSS" && (!styling || styling === "none" || styling === "Tanpa framework CSS")))
    ) || null
  );
}

