import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { Reveal } from "@/components/motion/reveal";
import { InteractiveHeroPreview } from "@/components/landing/interactive-hero-preview";
import { WikoDashboardMock } from "@/components/landing/wiko-dashboard-mock";
import { TechMarquee } from "@/components/landing/marquee";
import { WikoFaq } from "@/components/landing/wiko-faq";
import {
  ArrowUpRight,
  Code2,
  FileCode,
  Sparkles,
  Star,
  Zap,
  Lock,
  MessageSquare,
  ShieldCheck,
  Terminal,
  CheckCircle2,
  Check,
  Copy,
  TrendingUp,
  Cpu,
  Layers,
} from "lucide-react";

export const metadata = {
  title: "bisavibecoding — Lapisan Perencanaan AI untuk Vibe Coding",
  description:
    "Ubah ide mentah jadi PRD yang matang, lalu jadi task siap tempel ke AI coding agent (Claude Code, Cursor, Windsurf).",
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-warm-canvas text-foreground overflow-x-hidden">
      {/* Top Navbar */}
      <header className="surface-glass sticky top-0 z-40 border-b border-border/60 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <Logo markClassName="rounded-lg transition-warm group-hover:scale-105" wordmarkClassName="text-h3 font-heading" gradientId="bvc-landing" />
          </Link>

          <nav className="hidden items-center gap-8 text-small font-medium text-muted-foreground md:flex">
            <a href="#overview" className="transition-warm hover:text-foreground">
              Overview
            </a>
            <a href="#pipeline" className="transition-warm hover:text-foreground">
              PRD Pipeline
            </a>
            <a href="#fitur" className="transition-warm hover:text-foreground">
              Fitur Utama
            </a>
            <a href="#faq" className="transition-warm hover:text-foreground">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-3 py-1.5 text-small font-medium text-muted-foreground transition-warm hover:text-foreground"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-strong px-4 py-2 text-small font-semibold text-white shadow-warm-xs transition-warm hover:bg-brand-stronger hover:shadow-warm-sm hover:scale-105"
            >
              Coba Gratis <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="overview" className="relative overflow-hidden py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-soft-border bg-brand-soft px-3.5 py-1 text-tiny font-semibold text-brand-stronger shadow-warm-xs">
              <Sparkles className="size-3.5 text-brand" />
              Lapisan Perencanaan AI untuk Vibe Coding
            </span>
          </Reveal>

          <Reveal delay={1} className="mt-6">
            <h1 className="font-heading text-display font-normal tracking-tight text-foreground sm:text-[3.75rem] leading-[1.1]">
              Ubah ide mentah produkmu menjadi rencana yang{" "}
              <span className="relative inline-block text-brand-strong font-bold">
                sekali jalan benar
              </span>
              .
            </h1>
          </Reveal>

          <Reveal delay={2} className="mt-6">
            <p className="mx-auto max-w-reading text-body-lg text-muted-foreground leading-relaxed">
              bisavibecoding memandu idemu menjadi PRD yang matang, lalu me-breakdown-nya menjadi
              task mandiri yang membawa konteksnya sendiri — siap tempel ke Claude Code, Cursor, atau Windsurf.
            </p>
          </Reveal>

          <Reveal delay={3} className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-brand-strong px-7 py-3.5 text-small font-semibold text-white shadow-warm-md transition-warm hover:bg-brand-stronger hover:shadow-warm-lg hover:scale-105"
            >
              Coba Gratis Sekarang <ArrowUpRight className="size-4.5" />
            </Link>
            <a
              href="#pipeline"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3.5 text-small font-semibold text-foreground shadow-warm-xs transition-warm hover:bg-surface-raised hover:shadow-warm-sm"
            >
              Pelajari Alur Kerja ↓
            </a>
          </Reveal>

          {/* Hero Interactive Preview Simulator */}
          <Reveal delay={4} className="mt-14">
            <InteractiveHeroPreview />
          </Reveal>
        </div>
      </section>

      {/* Infinite Scrolling Tech Stack Marquee Bar */}
      <Reveal delay={1} className="my-4">
        <TechMarquee />
      </Reveal>

      {/* Workspace Pipeline Section */}
      <section id="pipeline" className="border-t border-border/60 bg-surface/40 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-tiny font-bold uppercase tracking-wider text-brand-stronger">
              4-Step Workflow Engine
            </span>
            <h2 className="mt-2 font-heading text-h1 text-foreground">
              Alur Kerja Workspace Paling Presisi
            </h2>
            <p className="mt-3 text-body text-muted-foreground">
              Jelajahi bagaimana bisavibecoding memproses spesifikasi produk dari ide mentah hingga menjadi task prompt siap pakai.
            </p>
          </Reveal>

          <Reveal delay={2} className="mt-12">
            <WikoDashboardMock />
          </Reveal>
        </div>
      </section>

      {/* Enterprise Features Grid Section */}
      <section id="fitur" className="border-t border-border/60 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-tiny font-bold uppercase tracking-wider text-brand-stronger">
              Fitur Enterprise Vibe Coding
            </span>
            <h2 className="mt-2 font-heading text-h1 text-foreground">
              3 Pilar Utama Rencana Tanpa Halusinasi
            </h2>
            <p className="mt-3 text-body text-muted-foreground">
              Dirancang khusus agar kamu tidak perlu membuang waktu menulis PRD manual atau merevisi instruksi AI berulang kali.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <Reveal delay={1}>
              <div className="group flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-7 shadow-warm-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-strong/40 hover:shadow-warm-md h-full">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-soft border border-brand-soft-border text-brand-strong transition-transform group-hover:scale-110">
                      <MessageSquare className="size-6" />
                    </div>
                    <span className="font-mono text-tiny font-bold text-muted-foreground">01</span>
                  </div>
                  <h3 className="mt-6 font-heading text-h3 text-foreground">
                    Intake Percakapan AI
                  </h3>
                  <p className="mt-2 text-small text-muted-foreground leading-relaxed">
                    Cukup ceritakan ide mentahmu. AI Architect partner akan balik bertanya 2-3 pertanyaan krusial untuk memperjelas spesifikasi produk.
                  </p>
                </div>

                {/* Styled Chat Preview Widget inside card */}
                <div className="mt-6 rounded-2xl border border-border/70 bg-surface-sunken/60 p-3.5 text-tiny space-y-2.5">
                  <div className="rounded-xl rounded-tr-xs bg-brand-soft border border-brand-soft-border p-2.5 text-foreground font-medium">
                    &quot;Saya mau buat SaaS invoicing simpel...&quot;
                  </div>
                  <div className="rounded-xl rounded-tl-xs bg-card border border-border/80 p-2.5 text-muted-foreground">
                    <span className="font-semibold text-brand-stronger">AI Architect:</span> Apakah status pembayaran mendukung cicilan?
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Feature 2 */}
            <Reveal delay={2}>
              <div className="group flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-7 shadow-warm-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-strong/40 hover:shadow-warm-md h-full">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-sage-soft border border-sage-soft-border text-sage-strong transition-transform group-hover:scale-110">
                      <ShieldCheck className="size-6" />
                    </div>
                    <span className="font-mono text-tiny font-bold text-muted-foreground">02</span>
                  </div>
                  <h3 className="mt-6 font-heading text-h3 text-foreground">
                    PRD Lock & Versioning
                  </h3>
                  <p className="mt-2 text-small text-muted-foreground leading-relaxed">
                    Dokumen PRD terstruktur dikunci sebagai single source of truth. Bebas dari instruksi liar yang saling bertentangan.
                  </p>
                </div>

                {/* Styled Document Lock Widget inside card */}
                <div className="mt-6 rounded-2xl border border-border/70 bg-surface-sunken/60 p-3.5 text-tiny space-y-2 font-mono">
                  <div className="flex items-center justify-between rounded-xl border border-sage-soft-border bg-sage-soft px-3 py-1.5 text-sage-text">
                    <span className="font-bold flex items-center gap-1.5">
                      <Lock className="size-3" /> PRD v1 Locked
                    </span>
                    <span className="text-[10px] font-semibold">100% Locked</span>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-card p-2.5 text-muted-foreground text-[11px]">
                    # 1. Ringkasan SaaS Invoicing<br />
                    # 2. Entitas Data & Model DB
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Feature 3 */}
            <Reveal delay={3}>
              <div className="group flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-7 shadow-warm-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-strong/40 hover:shadow-warm-md h-full">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-soft border border-amber-soft-border text-amber-text transition-transform group-hover:scale-110">
                      <Code2 className="size-6" />
                    </div>
                    <span className="font-mono text-tiny font-bold text-muted-foreground">03</span>
                  </div>
                  <h3 className="mt-6 font-heading text-h3 text-foreground">
                    Self-Contained Task Prompts
                  </h3>
                  <p className="mt-2 text-small text-muted-foreground leading-relaxed">
                    Setiap task memuat context slice, aturan spesifik, dan acceptance criteria siap tempel ke Claude Code, Cursor, atau Windsurf.
                  </p>
                </div>

                {/* Styled Dark IDE Terminal Snippet Widget inside card */}
                <div className="mt-6 overflow-hidden rounded-2xl border border border-[#3a322b] bg-[#1e1916] p-3 text-[11px] font-mono text-[#f4ece1]">
                  <div className="flex items-center justify-between border-b border-[#3a322b] pb-1.5 text-[10px] text-[#b3a596]">
                    <span>final_prompt.md</span>
                    <span className="text-sage-text font-bold">✓ Ready</span>
                  </div>
                  <div className="mt-2 text-[#f4ece1]/90 leading-tight truncate">
                    ## TUJUAN TASK #03<br />
                    - Files: app/invoices/new/page.tsx<br />
                    - Criteria: ✓ Export PDF Works
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Testimonials & Big Stats Section */}
      <section className="border-t border-border/60 bg-surface/50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <Reveal delay={1}>
              <div className="rounded-3xl border border-border/80 bg-card p-8 shadow-warm-xs sm:p-10 transition-all duration-300 hover:shadow-warm-md hover:border-brand-soft-border">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-tiny font-bold uppercase tracking-wider text-brand-stronger">
                    <Star className="size-4 fill-amber text-amber" />
                    Pengalaman Developer Real
                  </span>
                  <span className="rounded-full border border-sage-soft-border bg-sage-soft px-3 py-0.5 text-tiny font-semibold text-sage-text">
                    ✓ Terverifikasi
                  </span>
                </div>

                <blockquote className="mt-6 font-heading text-h2 font-normal leading-relaxed text-foreground">
                  &quot;Sebelum memakai bisavibecoding, saya menghabiskan 50% waktu memperbaiki halusinasi
                  Claude Code karena PRD yang terlalu luas. Sekarang, 1 task = 1 prompt sekali jalan
                  selesai!&quot;
                </blockquote>

                <div className="mt-8 flex items-center gap-3 border-t border-border/60 pt-6">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-brand-soft font-bold text-brand-stronger text-body shadow-warm-xs">
                    R
                  </div>
                  <div>
                    <div className="text-small font-semibold text-foreground">Rian Ardianto</div>
                    <div className="text-tiny text-muted-foreground">Fullstack Vibe Coder @ DevStudio</div>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={2}>
              <div className="grid gap-5 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-warm-xs transition-all duration-300 hover:shadow-warm-sm hover:-translate-y-1">
                  <div className="font-heading text-[2.75rem] font-bold text-sage-text">94%+</div>
                  <div className="mt-2 text-tiny font-semibold text-foreground">
                    Keberhasilan Task
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Prompt sekali jalan tanpa revisi
                  </p>
                </div>

                <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-warm-xs transition-all duration-300 hover:shadow-warm-sm hover:-translate-y-1">
                  <div className="font-heading text-[2.75rem] font-bold text-brand-strong">0%</div>
                  <div className="mt-2 text-tiny font-semibold text-foreground">
                    Spec Hallucination
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Tebak-tebakan entitas nol
                  </p>
                </div>

                <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-warm-xs transition-all duration-300 hover:shadow-warm-sm hover:-translate-y-1">
                  <div className="font-heading text-[2.75rem] font-bold text-foreground">4 Step</div>
                  <div className="mt-2 text-tiny font-semibold text-foreground">
                    Pipeline Engine
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Dari ide mentah ke prompt
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-6">
          <Reveal className="text-center">
            <span className="text-tiny font-bold uppercase tracking-wider text-brand-stronger">
              Jawaban Pertanyaan Umum
            </span>
            <h2 className="mt-2 font-heading text-h1 text-foreground">Pertanyaan Sering Diajukan</h2>
            <p className="mt-3 text-body text-muted-foreground">
              Temukan jawaban seputar alur kerja, integrasi AI Agent, dan ekspor aturan repo.
            </p>
          </Reveal>

          <Reveal delay={1} className="mt-12">
            <WikoFaq />
          </Reveal>
        </div>
      </section>

      {/* Bottom CTA Banner Section */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-brand-soft-border bg-gradient-to-b from-surface via-card to-brand-soft/40 p-10 text-center shadow-warm-lg sm:p-16 transition-all duration-500 hover:shadow-warm-brand/20">
              {/* Background Glow */}
              <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-brand-soft/60 blur-3xl" />
              <div className="pointer-events-none absolute -left-20 -bottom-20 size-80 rounded-full bg-amber-soft/60 blur-3xl" />

              <span className="inline-flex items-center gap-2 rounded-full border border-brand-soft-border bg-brand-soft px-4 py-1 text-tiny font-semibold text-brand-stronger shadow-warm-xs">
                <Sparkles className="size-3.5 text-brand-strong" />
                Siap Vibe Coding Tanpa Revisi Berulang?
              </span>

              <h2 className="mt-6 font-heading text-[2.25rem] sm:text-[3.25rem] font-normal leading-tight text-foreground">
                Mulai atur project-mu, sesuai caramu.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-body text-muted-foreground leading-relaxed">
                Daftar gratis sekarang dan ubah ide mentah pertamamu menjadi rencana PRD & prompt yang siap ditempel ke Claude Code atau Cursor.
              </p>

              <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-strong px-8 py-3.5 text-small font-semibold text-white shadow-warm-md transition-all duration-300 hover:bg-brand-stronger hover:scale-105 hover:shadow-warm-lg"
                >
                  Coba Gratis Sekarang <ArrowUpRight className="size-4.5" />
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-border bg-card px-7 py-3.5 text-small font-semibold text-foreground shadow-warm-xs transition-all duration-300 hover:bg-surface-raised hover:scale-105"
                >
                  Masuk Akun
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card py-8 text-tiny text-muted-foreground">
        <Reveal>
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
            <Logo wordmarkClassName="text-body" markClassName="size-7" gradientId="wiko-footer" />
            <p>© 2026 bisavibecoding. Lapisan Perencanaan AI untuk Vibe Coding.</p>
          </div>
        </Reveal>
      </footer>
    </div>
  );
}
