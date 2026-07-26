"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Reveal } from "@/components/motion/reveal";
import { InteractiveHeroPreview } from "@/components/landing/interactive-hero-preview";
import { WikoDashboardMock } from "@/components/landing/wiko-dashboard-mock";
import { TechMarquee } from "@/components/landing/marquee";
import { WikoFaq } from "@/components/landing/wiko-faq";
import { SectionDivider } from "@/components/landing/section-divider";
import { PricingCards } from "@/components/landing/pricing-cards";
import {
  ArrowUpRight,
  Sparkles,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  CheckCircle2,
  FileCode2,
  Terminal,
  Database,
  ShieldCheck,
  ChevronRight,
  Layers,
  Tag,
  HelpCircle,
  ArrowRight,
  Radio,
  Bug,
} from "lucide-react";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [activeProblem, setActiveProblem] = useState(0);

  const problemDetails = [
    {
      id: "prompting",
      title: "1. Prompting Tanpa Arah",
      subtitle: "Instruksi acak tanpa instruksi arsitektur yang jelas",
      badge: "Sering Terjadi #1",
      icon: AlertTriangle,
      errorSnippet: `// ❌ AI HASILKAN KODE HALUSINASI TANPA DB SCHEMAS
export async function POST(req) {
  const data = await req.json();
  // Error: Table 'user_invoices' does not exist in schema!
  return db.query("SELECT * FROM user_invoices WHERE id = ?", [data.id]); 
}`,
      solutionSnippet: `// ✔️ BISAVIBECODING: PRD TERKUNCI DENGAN SCHEMAS DRIZZLE
export async function POST(req: Request) {
  const session = await getAuthSession(); // Checked via guardrails
  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, params.id)
  });
  return NextResponse.json(invoice);
}`,
      explanation:
        "Tanpa PRD, AI menebak nama tabel DB & pola routing. bisavibecoding mengunci skema DB & variabel sistem sehingga AI hanya menulis kode yang lolos typecheck.",
    },
    {
      id: "structure",
      title: "2. Kode Berantakan Tanpa PRD",
      subtitle: "AI merombak folder, merusak import, dan menduplikasi helper",
      badge: "Sering Terjadi #2",
      icon: XCircle,
      errorSnippet: `// ❌ AI MEMBUAT UTILITY DUPLIKAT DI LOKASI RANDOM
import { formatDate } from "../../../utils/date-helper"; // Duplikasi #1
import { formatCustomDate } from "@/lib/helpers/date"; // Duplikasi #2
import { parseDate } from "@/utils/time"; // Duplikasi #3`,
      solutionSnippet: `// ✔️ BISAVIBECODING: SINGLE SOURCE OF TRUTH REPO RULES
import { formatDate } from "@/lib/utils"; // Satu pintu utility terpusat
// Validasi otomatis mencegah AI membuat file helper liar di luar /lib`,
      explanation:
        "AI cenderung menduplikasi file helper saat tidak tahu struktur repo. Rule guardrails bisavibecoding mengarahkan AI untuk memakai impor yang sudah ada.",
    },
    {
      id: "debug",
      title: "3. Waktu Habis Debug AI",
      subtitle: "80% waktu terbuang membenahi halusinasi & regresi fitur",
      badge: "Sering Terjadi #3",
      icon: ShieldAlert,
      errorSnippet: `// ❌ REGRESI: HIT KODE BARU MERUSAK AUTH SERVER COMPONENT
// Uncaught Error: async/await is not supported in client component
"use client"; 
export async function Page() { /* Auth Server Component rusak */ }`,
      solutionSnippet: `// ✔️ BISAVIBECODING: ATOMIC TASK WITH ACCEPTANCE CRITERIA
// Task Prompt #04 membawa boundary 'server-only' & test criteria
import "server-only";
export async function Page() { /* Clean Server Component */ }`,
      explanation:
        "Setiap Task Prompt membawa boundary 'server-only' / 'use client' serta kriteria penerimaan siap uji sebelum kode disubmit.",
    },
  ];

  const featureTabs = [
    {
      id: "prd",
      title: "Build Standardized PRD",
      subtitle: "Lapisan Arsitektur Sebelum Kode",
      description:
        "Ubah deskripsi ide mentah menjadi Dokumen PRD terstruktur lengkap dengan Spesifikasi Produk, Entitas Database, dan Route Map tanpa perlu menulis manual.",
      badge: "PRD Engine",
      previewHeader: "DOCUMENTATION SPECIFICATION (PRD v1.0)",
      previewContent: `// 1. SPECIFICATION SUMMARY
Project: SaaS Invoicing Engine
Target: Single Source of Truth for AI Agents
Architecture: Next.js 15 App Router + Drizzle ORM

// 2. DATABASE ENTITIES & SCHEMAS
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey(),
  amount: integer("amount").notNull(),
  status: text("status", { enum: ["draft", "paid"] }),
});`,
    },
    {
      id: "generator",
      title: "Agent Prompt Generator",
      subtitle: "Self-Contained Task Prompts",
      description:
        "Setiap fitur dipecah menjadi unit task mandiri (atomic task) yang memuat konteks penuh, batasan aturan, dan kriteria penerimaan siap tempel ke Claude Code, Cursor, atau Windsurf.",
      badge: "Prompt Engineering",
      previewHeader: "ATOMIC TASK PROMPT FOR AI AGENT",
      previewContent: `## TASK SPECIFICATION #04
Goal: Create Invoice Details Route with PDF Export
Context Files: @lib/supabase/server.ts @components/ui/button.tsx

Requirements:
- Enforce strict server side authorization check
- Render status pill using tailwind tokens
- Export PDF action using Next.js server actions`,
    },
    {
      id: "validation",
      title: "Architecture Validation",
      subtitle: "Cegah AI Melanggar Rule Repo",
      description:
        "Fitur pemeriksaan otomatis yang memastikan AI Agent tidak memodifikasi file inti secara liar, merusak struktur folder, atau melanggar konvensi penamaan kode.",
      badge: "Guardrails",
      previewHeader: "REPO RULE COMPLIANCE CHECK",
      previewContent: `[VALIDATION CHECKLIST]
✔ Standardized Folder Structure (app/ & components/ui)
✔ Zero Ad-Hoc Inline Tailwind Utility Overrides
✔ RLS Policy Guard Enforcement
✔ Strict TypeScript Return Signature Validated`,
    },
    {
      id: "memory",
      title: "Context-Aware Memory",
      subtitle: "Riwayat Keputusan Arsitektur",
      description:
        "Menyimpan riwayat keputusan dan constraint teknis di seluruh tahapan sprint, sehingga prompt berikutnya tidak akan memicu regresi atau membatalkan fitur yang sudah selesai.",
      badge: "State Persistence",
      previewHeader: "DECISION HISTORY LOG (D-003)",
      previewContent: `[ARCHITECTURE DECISION LOG - D-003]
Status: LOCKED & VERIFIED
Decision: Use Drizzle ORM over Prisma for Edge compatibility.
Impact: Prompt generator will restrict all database queries to Drizzle schemas.`,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-[#0F172A] font-sans antialiased overflow-x-hidden selection:bg-[#BEF264] selection:text-[#0F172A]">
      {/* Ambient Background Glow Mesh */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-linear-to-b from-[#BEF264]/20 via-emerald-500/10 to-transparent blur-3xl opacity-80" />
        <div className="absolute top-1/3 -left-60 w-[500px] h-[500px] bg-[#BEF264]/10 blur-3xl rounded-full" />
        <div className="absolute top-2/3 -right-60 w-[500px] h-[500px] bg-emerald-500/10 blur-3xl rounded-full" />
      </div>

      {/* 1. High-End Floating Glass Header */}
      <header className="sticky top-5 z-50 mx-auto w-[calc(100%-2rem)] max-w-4xl rounded-full border border-slate-200/80 bg-white/85 px-6 py-2.5 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="group flex items-center gap-2">
            <Logo
              markClassName="size-7 rounded-lg transition-transform group-hover:scale-105"
              wordmarkClassName="text-sm font-extrabold text-[#0F172A] tracking-tight"
              gradientId="bvc-floating-logo"
            />
          </Link>

          {/* Clean Navigation Links */}
          <nav className="hidden items-center gap-7 text-xs font-bold text-slate-600 sm:flex">
            <a href="#pipeline" className="transition-colors hover:text-[#059669]">
              Alur Kerja
            </a>
            <a href="#features" className="transition-colors hover:text-[#059669]">
              Fitur
            </a>
            <a href="#pricing" className="transition-colors hover:text-[#059669]">
              Harga
            </a>
            <a href="#faq" className="transition-colors hover:text-[#059669]">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-3.5 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:text-[#059669]"
            >
              Masuk
            </Link>
            {/* Electric Lime Button with Dark Navy Accent */}
            <Link
              href="/register"
              className="group inline-flex items-center gap-1.5 rounded-full bg-[#BEF264] pl-4 pr-1.5 py-1.5 text-xs font-extrabold text-[#0F172A] shadow-sm transition-all hover:bg-[#a3e635] hover:scale-[1.02]"
            >
              <span>Mulai Gratis</span>
              <div className="flex size-5 items-center justify-center rounded-full bg-[#0F172A] transition-transform group-hover:translate-x-0.5">
                <ArrowUpRight className="size-3 text-[#BEF264]" />
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section id="overview" className="relative z-10 overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-lime-300 bg-[#BEF264] px-4 py-1.5 text-xs font-extrabold text-[#0F172A] shadow-xs">
              <Sparkles className="size-3.5 text-[#0F172A]" />
              Lapisan Arsitektur AI untuk Vibe Coding
            </span>
          </Reveal>

          <Reveal delay={1} className="mt-6">
            <h1 className="font-sans text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#0F172A] leading-[1.08]">
              Ubah ide mentah menjadi rencana yang{" "}
              <span className="bg-linear-to-r from-[#059669] via-emerald-600 to-[#0F172A] bg-clip-text text-transparent">
                sekali jalan benar
              </span>
              .
            </h1>
          </Reveal>

          <Reveal delay={2} className="mt-6">
            <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
              bisavibecoding memandu idemu menjadi PRD yang matang, lalu memecahnya menjadi task mandiri berkonteks tinggi: siap tempel ke Claude Code, Cursor, atau Windsurf.
            </p>
          </Reveal>

          <Reveal delay={3} className="mt-9 flex flex-wrap items-center justify-center gap-4">
            {/* Primary Action Button: Electric Lime */}
            <Link
              href="/register"
              className="group inline-flex items-center gap-3 rounded-full bg-[#BEF264] pl-7 pr-2 py-2.5 text-sm font-extrabold text-[#0F172A] shadow-xl shadow-[#BEF264]/40 transition-all hover:bg-[#a3e635] hover:scale-[1.03]"
            >
              <span>Mulai Vibecoding Sekarang</span>
              <div className="flex size-8 items-center justify-center rounded-full bg-[#0F172A] transition-transform group-hover:translate-x-1 group-hover:-translate-y-[1px]">
                <ArrowUpRight className="size-4 text-[#BEF264]" />
              </div>
            </Link>
            <a
              href="#pipeline"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:bg-slate-50 hover:border-slate-300"
            >
              Pelajari Alur Kerja ↓
            </a>
          </Reveal>

          {/* Hero Interactive Preview Component */}
          <Reveal delay={4} className="mt-14">
            <div className="rounded-[2rem] p-1.5 bg-slate-200/50 border border-slate-200/80 shadow-xs">
              <div className="rounded-[calc(2rem-0.375rem)] bg-white p-2 sm:p-4 shadow-sm border border-slate-100">
                <InteractiveHeroPreview />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Infinite Scroll Tech Stack Marquee */}
      <Reveal delay={1}>
        <TechMarquee />
      </Reveal>

      {/* 3. Interactive Problem Inspector Section */}
      <section id="problems" className="relative z-10 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#059669]">
              Interactive Problem Inspector
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Mengapa Coding Bersama AI Sering Berakhir Kacau?
            </h2>
            <p className="mt-4 text-slate-600 text-base font-medium">
              Klik pada 3 masalah utama di bawah untuk melihat perbedaan nyata antara kegagalan AI tanpa PRD vs solusi bisavibecoding.
            </p>
          </Reveal>

          {/* Interactive 3 Problems Selector */}
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4">
            {problemDetails.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = activeProblem === idx;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveProblem(idx)}
                  className={`w-full text-left rounded-2xl p-5 transition-all duration-300 border cursor-pointer ${
                    isSelected
                      ? "bg-white border-[#059669] shadow-xl ring-2 ring-[#059669]/20 scale-[1.02]"
                      : "bg-white/80 border-slate-200/80 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`size-10 rounded-xl flex items-center justify-center ${
                        isSelected ? "bg-emerald-100/80 text-[#059669]" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-emerald-100/80 text-[#059669]"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="mt-4 font-extrabold text-base text-[#0F172A]">{item.title}</h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{item.subtitle}</p>
                </button>
              );
            })}
          </div>

          {/* Dynamic Before vs After Comparison Inspector Box */}
          <Reveal delay={1} className="mt-8">
            <div className="rounded-[2rem] p-1.5 bg-slate-200/60 border border-slate-200/90 shadow-lg">
              <div className="rounded-[calc(2rem-0.375rem)] bg-white p-6 sm:p-8 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                  <div className="flex items-center gap-2">
                    <Bug className="size-5 text-[#059669]" />
                    <h4 className="font-extrabold text-base text-[#0F172A]">
                      {problemDetails[activeProblem].title}
                    </h4>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {problemDetails[activeProblem].explanation}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono text-xs">
                  {/* Error Box */}
                  <div className="rounded-xl border border-rose-900/60 bg-[#0F172A] p-4 text-rose-300 shadow-md">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 text-rose-400 text-[11px] font-bold">
                      <span className="flex items-center gap-1.5">
                        <XCircle className="size-4 text-rose-400" /> KODE KACAU TANPA PRD
                      </span>
                      <span className="text-rose-400">HALUSINASI AI</span>
                    </div>
                    <pre className="whitespace-pre-wrap leading-relaxed text-slate-300 text-[11px]">
                      {problemDetails[activeProblem].errorSnippet}
                    </pre>
                  </div>

                  {/* Solution Box */}
                  <div className="rounded-xl border border-emerald-800/80 bg-[#0F172A] p-4 text-slate-100 shadow-md">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 text-[#BEF264] text-[11px] font-bold">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="size-4 text-[#BEF264]" /> SOLUSI BISAVIBECODING
                      </span>
                      <span className="text-emerald-300">VALIDATED PRD</span>
                    </div>
                    <pre className="whitespace-pre-wrap leading-relaxed text-slate-200 text-[11px]">
                      {problemDetails[activeProblem].solutionSnippet}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 4. Workspace Pipeline Section */}
      <section id="pipeline" className="relative z-10 py-20 sm:py-28 bg-white/60 border-y border-slate-200/60">
        <SectionDivider label="PRD WORKFLOW ENGINE" icon={Layers} />

        <div className="mx-auto max-w-6xl px-6 mt-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#059669]">
              4-Step Workflow Engine
            </span>
            <h2 className="mt-2 font-sans text-3xl sm:text-4xl font-extrabold text-[#0F172A]">
              Alur Kerja Workspace Paling Presisi
            </h2>
            <p className="mt-3 text-base text-slate-600 font-medium">
              Jelajahi bagaimana bisavibecoding memproses spesifikasi produk dari ide mentah hingga menjadi task prompt siap pakai.
            </p>
          </Reveal>

          <Reveal delay={2} className="mt-12">
            <WikoDashboardMock />
          </Reveal>
        </div>
      </section>

      {/* 5. Strongly Branded Comparison Section */}
      <section id="comparison" className="relative z-10 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#059669]">
              Perbandingan Solusi
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Mengapa Developer Memilih bisavibecoding?
            </h2>
            <p className="mt-4 text-slate-600 text-base font-medium">
              Bandingkan alur kerja tradisional dengan alur kerja terstruktur dari SaaS kami.
            </p>
          </Reveal>

          <div className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Column 1: Manual / ChatGPT */}
            <Reveal delay={1} className="lg:col-span-5 flex">
              <div className="rounded-[2rem] p-1.5 bg-slate-200/50 border border-slate-200/80 shadow-xs w-full">
                <div className="rounded-[calc(2rem-0.375rem)] bg-white p-7 border border-slate-100 shadow-sm flex flex-col justify-between h-full">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Metode 01</span>
                    <h3 className="mt-2 text-xl font-extrabold text-slate-800">Prompting Manual / ChatGPT</h3>
                    <p className="mt-2 text-xs text-slate-500">Mengetik instruksi mentah ke ChatGPT / Claude.</p>
                    <hr className="my-6 border-slate-100" />
                    <ul className="space-y-4 text-sm text-slate-600">
                      <li className="flex items-start gap-3">
                        <XCircle className="size-5 text-rose-500 shrink-0 mt-0.5" />
                        <span>Instruksi sepotong-sepotong tanpa PRD resmi</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <XCircle className="size-5 text-rose-500 shrink-0 mt-0.5" />
                        <span>Sangat rawan halusinasi & merusak dependensi</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <XCircle className="size-5 text-rose-500 shrink-0 mt-0.5" />
                        <span>Harus mengulang penjelasan konteks berkali-kali</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Column 2: Bisavibecoding (Us) — Highly Branded Bento Card */}
            <Reveal delay={2} className="lg:col-span-7 flex">
              <div className="rounded-[2rem] p-1.5 bg-linear-to-br from-[#BEF264] via-emerald-400 to-[#15803D] shadow-xl w-full">
                <div className="rounded-[calc(2rem-0.375rem)] bg-[#0F172A] p-8 border border-slate-800 shadow-sm flex flex-col justify-between h-full relative overflow-hidden">
                  <div className="absolute top-6 right-6">
                    <span className="rounded-full bg-[#BEF264] px-3.5 py-1 text-xs font-extrabold text-[#0F172A] shadow-xs uppercase tracking-wider">
                      Rekomendasi Vibe Coder
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Logo markClassName="size-8 rounded-xl" wordmarkClassName="text-xl font-extrabold text-white" gradientId="bvc-cmp-brand" />
                    </div>
                    <p className="text-xs text-slate-300 mt-1">Lapisan perencanaan terstruktur sebelum kode ditulis.</p>
                    <hr className="my-6 border-slate-800" />
                    <ul className="space-y-4 text-sm font-medium text-slate-200">
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="size-5 text-[#BEF264] shrink-0 mt-0.5" />
                        <span><strong>Intake Interaktif:</strong> Tanya jawab cerdas penyusun PRD</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="size-5 text-[#BEF264] shrink-0 mt-0.5" />
                        <span><strong>PRD Versioning & Lock:</strong> Single source of truth teruji</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="size-5 text-[#BEF264] shrink-0 mt-0.5" />
                        <span><strong>Atomic Task Prompts:</strong> 100% siap tempel ke Claude Code & Cursor</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="size-5 text-[#BEF264] shrink-0 mt-0.5" />
                        <span><strong>Guardrails & Rules Validation:</strong> Bebas dari halusinasi kode</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-[#BEF264]">
                    <span>Hemat hingga 80% waktu refaktor</span>
                    <Link href="/register" className="inline-flex items-center gap-1 hover:underline font-bold">
                      Coba Sekarang <ArrowRight className="size-4 text-[#BEF264]" />
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 6. Key Features (Vertical Tabs - Fixed Contrast UX) */}
      <section id="features" className="relative z-10 py-20 sm:py-28 bg-white/60 border-y border-slate-200/60">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#059669]">
              Fitur Utama SaaS
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Teknologi Arsitektur untuk Hasil Sekali Jalan Benar
            </h2>
            <p className="mt-4 text-slate-600 text-base font-medium">
              Klik setiap tab di bawah untuk melihat alur kerja lengkap.
            </p>
          </Reveal>

          <div className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column Tabs */}
            <div className="lg:col-span-4 space-y-3">
              {featureTabs.map((tab, idx) => {
                const isActive = activeTab === idx;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(idx)}
                    className={`w-full text-left p-5 rounded-2xl transition-all duration-300 flex items-start gap-4 cursor-pointer ${
                      isActive
                        ? "bg-[#0F172A] text-white shadow-xl scale-[1.02]"
                        : "bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`size-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isActive ? "bg-emerald-950/80 text-[#BEF264]" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {idx === 0 && <FileCode2 className="size-5" />}
                      {idx === 1 && <Terminal className="size-5" />}
                      {idx === 2 && <ShieldCheck className="size-5" />}
                      {idx === 3 && <Database className="size-5" />}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-extrabold text-base ${isActive ? "text-white" : "text-[#0F172A]"}`}>
                          {tab.title}
                        </h4>
                        {isActive && <ChevronRight className="size-4 text-[#BEF264]" />}
                      </div>
                      <p
                        className={`text-xs mt-1 line-clamp-2 ${
                          isActive ? "text-slate-300 font-medium" : "text-slate-500"
                        }`}
                      >
                        {tab.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Display Area */}
            <div className="lg:col-span-8">
              <div className="rounded-[2rem] p-1.5 bg-slate-200/50 border border-slate-200/80 shadow-xs">
                <div className="rounded-[calc(2rem-0.375rem)] bg-white p-8 border border-slate-100 shadow-sm min-h-[420px] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="rounded-full bg-[#BEF264] px-3.5 py-1 text-xs font-extrabold text-[#0F172A]">
                        {featureTabs[activeTab].badge}
                      </span>
                      <span className="font-mono text-xs text-slate-400">
                        Feature 0{activeTab + 1} / 04
                      </span>
                    </div>

                    <h3 className="text-2xl font-extrabold text-[#0F172A]">
                      {featureTabs[activeTab].title}
                    </h3>
                    <p className="mt-3 text-sm text-slate-600 leading-relaxed font-medium">
                      {featureTabs[activeTab].description}
                    </p>

                    {/* Display Area Content Box */}
                    <div className="mt-6 rounded-2xl bg-[#0F172A] p-5 font-mono text-xs text-slate-200 overflow-x-auto">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 text-slate-400 text-[11px]">
                        <span>{featureTabs[activeTab].previewHeader}</span>
                        <span className="text-[#BEF264] font-bold">READY</span>
                      </div>
                      <pre className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {featureTabs[activeTab].previewContent}
                      </pre>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Kompatibel dengan Claude Code, Cursor, & Windsurf</span>
                    <Link
                      href="/register"
                      className="font-extrabold text-[#059669] flex items-center gap-1 hover:underline"
                    >
                      Coba Fitur Ini <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Pricing & Plans Section */}
      <section id="pricing" className="relative z-10 py-20 sm:py-28">
        <SectionDivider label="HARGA & PAKET" icon={Tag} />

        <div className="mx-auto max-w-6xl px-6 mt-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#059669]">
              Paket Berlangganan Hemat
            </span>
            <h2 className="mt-2 font-sans text-3xl sm:text-4xl font-extrabold text-[#0F172A]">
              Pilih Paket Sesuai Kebutuhan Build-mu
            </h2>
            <p className="mt-3 text-base text-slate-600 font-medium">
              Tanpa biaya tersembunyi. Dapatkan akses penuh ke AI Architect Engine untuk menghasilkan PRD dan task prompt presisi.
            </p>
          </Reveal>

          <Reveal delay={1} className="mt-14">
            <PricingCards />
          </Reveal>
        </div>
      </section>

      {/* 8. FAQ Section */}
      <section id="faq" className="relative z-10 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-6">
          <Reveal className="text-center mb-16">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-extrabold text-[#059669] uppercase tracking-wider">
              <HelpCircle className="size-3.5" />
              FAQ
            </span>
            <h2 className="mt-5 font-sans text-3xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight">
              Pertanyaan yang Sering Ditanyakan
            </h2>
            <p className="mt-4 mx-auto max-w-xl text-base sm:text-lg text-slate-500 leading-relaxed">
              Semua yang perlu kamu ketahui tentang alur kerja, integrasi AI Agent, dan fitur ekspor.
            </p>
          </Reveal>

          <Reveal delay={1}>
            <WikoFaq />
          </Reveal>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="relative z-10 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal>
            <div className="rounded-[2.5rem] p-2 bg-linear-to-br from-[#BEF264] via-emerald-400 to-[#15803D] shadow-xl">
              <div className="relative rounded-[calc(2.5rem-0.5rem)] bg-[#0F172A] p-10 sm:p-16 text-center border border-slate-800">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/90 px-4 py-1.5 text-xs font-extrabold text-[#BEF264] shadow-xs mb-6">
                  <Sparkles className="size-3.5 text-[#BEF264]" />
                  Siap Vibe Coding Tanpa Revisi Berulang?
                </span>

                <h2 className="font-sans text-3xl sm:text-5xl font-extrabold text-white leading-tight">
                  Mulai atur project-mu, sesuai caramu.
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base text-slate-300 leading-relaxed font-medium">
                  Daftar gratis sekarang dan ubah ide mentah pertamamu menjadi rencana PRD & prompt yang siap ditempel ke Claude Code atau Cursor.
                </p>

                <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                  <Link
                    href="/register"
                    className="group inline-flex items-center gap-3 rounded-full bg-[#BEF264] pl-8 pr-2.5 py-3 text-sm font-extrabold text-[#0F172A] shadow-xl shadow-[#BEF264]/20 transition-all hover:bg-[#a3e635] hover:scale-[1.03]"
                  >
                    <span>Coba Gratis Sekarang</span>
                    <div className="flex size-8 items-center justify-center rounded-full bg-[#0F172A] transition-transform group-hover:translate-x-1">
                      <ArrowUpRight className="size-4 text-[#BEF264]" />
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 9. Comprehensive High-End SaaS Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-16 text-xs text-slate-600 relative z-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5 pb-12 border-b border-slate-100">
            {/* Brand Column */}
            <div className="lg:col-span-2 space-y-4">
              <Logo wordmarkClassName="text-base font-extrabold text-[#0F172A]" markClassName="size-8" gradientId="bvc-footer-main" />
              <p className="text-slate-500 max-w-sm leading-relaxed text-xs">
                Lapisan perencanaan arsitektur AI untuk Vibe Coding. Memandu ide mentah menjadi PRD terstruktur & task prompt presisi untuk Claude Code, Cursor, dan Windsurf.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-50 px-3 py-1 text-[11px] font-bold text-[#3F6212] border border-lime-200">
                  <Radio className="size-3 text-[#3F6212] animate-pulse" /> All Systems Operational 99.99%
                </span>
              </div>
            </div>

            {/* Links Column 1 */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-[#0F172A] text-xs uppercase tracking-wider">Produk</h4>
              <ul className="space-y-2 text-slate-600">
                <li><a href="#pipeline" className="hover:text-[#059669] transition-colors">PRD Engine</a></li>
                <li><a href="#features" className="hover:text-[#059669] transition-colors">Agent Prompt Generator</a></li>
                <li><a href="#features" className="hover:text-[#059669] transition-colors">Architecture Guardrails</a></li>
                <li><a href="#features" className="hover:text-[#059669] transition-colors">Context Memory Sync</a></li>
              </ul>
            </div>

            {/* Links Column 2 */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-[#0F172A] text-xs uppercase tracking-wider">Integrasi Agent</h4>
              <ul className="space-y-2 text-slate-600">
                <li><span className="hover:text-[#059669] transition-colors cursor-default">Claude Code CLI</span></li>
                <li><span className="hover:text-[#059669] transition-colors cursor-default">Cursor IDE</span></li>
                <li><span className="hover:text-[#059669] transition-colors cursor-default">Windsurf Editor</span></li>
                <li><span className="hover:text-[#059669] transition-colors cursor-default">GitHub Copilot</span></li>
              </ul>
            </div>

            {/* Links Column 3 */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-[#0F172A] text-xs uppercase tracking-wider">Akses</h4>
              <ul className="space-y-2 text-slate-600">
                <li><Link href="/login" className="hover:text-[#059669] transition-colors">Masuk Akun</Link></li>
                <li><Link href="/register" className="hover:text-[#059669] transition-colors">Daftar Akun Baru</Link></li>
                <li><a href="#pricing" className="hover:text-[#059669] transition-colors">Paket Langganan</a></li>
                <li><a href="#faq" className="hover:text-[#059669] transition-colors">Pusat Bantuan</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
            <p>© 2026 bisavibecoding. Seluruh hak cipta dilindungi undang-undang.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-[#059669] transition-colors">Syarat & Ketentuan</a>
              <a href="#" className="hover:text-[#059669] transition-colors">Kebijakan Privasi</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
