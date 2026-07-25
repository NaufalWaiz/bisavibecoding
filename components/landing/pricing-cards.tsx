"use client";

import Link from "next/link";
import { Check, Sparkles, Zap, Flame, Crown, ArrowRight, Gift } from "lucide-react";

export function PricingCards() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:items-stretch">
      {/* 0. FREE PLAN */}
      <div className="group flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 shadow-warm-xs transition-all duration-300 hover:border-brand-strong/40 hover:shadow-warm-md hover:-translate-y-1 h-full">
        <div>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-sunken px-2.5 py-0.5 text-tiny font-semibold text-muted-foreground">
              <Gift className="size-3 text-muted-foreground" /> Free
            </span>
            <span className="font-mono text-tiny font-bold text-muted-foreground">00</span>
          </div>

          <h3 className="mt-5 font-heading text-h3 text-foreground">Free Plan</h3>
          <p className="mt-1 text-tiny text-muted-foreground">
            Untuk uji coba pertama kali dan eksplorasi alur kerja.
          </p>

          <div className="mt-5 flex items-baseline gap-1">
            <span className="font-heading text-h1 font-bold text-foreground">
              GRATIS AJA
            </span>
            <span className="text-tiny text-muted-foreground">/bulan</span>
          </div>

          <div className="mt-3 rounded-xl border border-border bg-surface-sunken px-3 py-1.5 font-mono text-tiny font-bold text-muted-foreground">
            🎁 3 Generasi PRD / bulan
          </div>

          <ul className="mt-5 space-y-2.5 text-tiny text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-sage-strong font-bold" />
              <span>3 PRD terstruktur per bulan</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-sage-strong font-bold" />
              <span>Basic Task Breakdown Prompts</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-sage-strong font-bold" />
              <span>Ekspor <code className="font-mono text-foreground font-bold">CLAUDE.md</code> dasar</span>
            </li>
          </ul>
        </div>

        <Link
          href="/subscription"
          className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-sunken px-4 py-2.5 text-tiny font-semibold text-foreground shadow-warm-xs transition-all duration-300 group-hover:bg-brand-strong group-hover:text-white group-hover:shadow-warm-sm"
        >
          Coba Gratis <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {/* 1. STARTER PLAN */}
      <div className="group flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 shadow-warm-xs transition-all duration-300 hover:border-brand-strong/40 hover:shadow-warm-md hover:-translate-y-1 h-full">
        <div>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-sunken px-2.5 py-0.5 text-tiny font-semibold text-muted-foreground">
              <Zap className="size-3 text-brand-strong" /> Starter
            </span>
            <span className="font-mono text-tiny font-bold text-muted-foreground">01</span>
          </div>

          <h3 className="mt-5 font-heading text-h3 text-foreground">Starter Plan</h3>
          <p className="mt-1 text-tiny text-muted-foreground">
            Cocok untuk solo developer & indie hacker yang baru mulai.
          </p>

          <div className="mt-5 flex items-baseline gap-1">
            <span className="font-heading text-h1 font-bold text-foreground">
              Rp 15.000
            </span>
            <span className="text-tiny text-muted-foreground">/bulan</span>
          </div>

          <div className="mt-3 rounded-xl border border-brand-soft-border bg-brand-soft/60 px-3 py-1.5 font-mono text-tiny font-bold text-brand-stronger">
            ⚡ 20 Generasi PRD / bulan
          </div>

          <ul className="mt-5 space-y-2.5 text-tiny text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-sage-strong font-bold" />
              <span>20 PRD terstruktur per bulan</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-sage-strong font-bold" />
              <span>Unlimited Breakdown Task Prompts</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-sage-strong font-bold" />
              <span>Ekspor <code className="font-mono text-foreground font-bold">CLAUDE.md</code> & rules</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-sage-strong font-bold" />
              <span>Dukungan Claude Code, Cursor & Windsurf</span>
            </li>
          </ul>
        </div>

        <Link
          href="/subscription"
          className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-sunken px-4 py-2.5 text-tiny font-semibold text-foreground shadow-warm-xs transition-all duration-300 group-hover:bg-brand-strong group-hover:text-white group-hover:shadow-warm-sm"
        >
          Pilih Starter <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {/* 2. PRO PLAN (RECOMMENDED) */}
      <div className="relative group flex flex-col justify-between rounded-3xl border-2 border-brand-strong bg-gradient-to-b from-card via-card to-brand-soft/30 p-6 shadow-warm-md transition-all duration-300 hover:shadow-warm-lg hover:-translate-y-1.5 h-full">
        {/* Recommended Badge Ribbon */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full border border-brand-strong bg-brand-strong px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-warm-brand">
            <Flame className="size-3 fill-white text-white" /> Paling Populer
          </span>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-soft-border bg-brand-soft px-2.5 py-0.5 text-tiny font-bold text-brand-stronger">
              <Sparkles className="size-3 text-brand-strong" /> Pro
            </span>
            <span className="font-mono text-tiny font-bold text-brand-strong">02</span>
          </div>

          <h3 className="mt-5 font-heading text-h3 text-foreground">Pro Plan</h3>
          <p className="mt-1 text-tiny text-muted-foreground">
            Untuk vibe coder aktif & builder SaaS berkecepatan tinggi.
          </p>

          <div className="mt-5 flex items-baseline gap-1">
            <span className="font-heading text-h1 font-bold text-brand-stronger">
              Rp 30.000
            </span>
            <span className="text-tiny text-muted-foreground">/bulan</span>
          </div>

          <div className="mt-3 rounded-xl border border-brand-strong/30 bg-brand-strong text-white px-3 py-1.5 font-mono text-tiny font-bold shadow-warm-xs">
            🔥 50 Generasi PRD / bulan
          </div>

          <ul className="mt-5 space-y-2.5 text-tiny text-foreground">
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-brand-strong font-bold" />
              <span className="font-semibold">50 PRD terstruktur per bulan</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-brand-strong font-bold" />
              <span>Akses Premium AI Architect Engine</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-brand-strong font-bold" />
              <span>PRD Lock & Unlimited Versioning</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-brand-strong font-bold" />
              <span>Fast-track Task Breakdown Prompts</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-brand-strong font-bold" />
              <span>Ekspor Lengkap Aturan Repo</span>
            </li>
          </ul>
        </div>

        <Link
          href="/subscription"
          className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-strong px-4 py-2.5 text-tiny font-semibold text-white shadow-warm-md transition-all duration-300 hover:bg-brand-stronger hover:shadow-warm-lg"
        >
          Pilih Pro Sekarang <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {/* 3. ULTRA PLAN */}
      <div className="group flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 shadow-warm-xs transition-all duration-300 hover:border-brand-strong/40 hover:shadow-warm-md hover:-translate-y-1 h-full">
        <div>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-soft-border bg-amber-soft px-2.5 py-0.5 text-tiny font-bold text-amber-text">
              <Crown className="size-3 text-amber" /> Ultra
            </span>
            <span className="font-mono text-tiny font-bold text-muted-foreground">03</span>
          </div>

          <h3 className="mt-5 font-heading text-h3 text-foreground">Ultra Plan</h3>
          <p className="mt-1 text-tiny text-muted-foreground">
            Performa tanpa batas untuk studio, agency, dan power user.
          </p>

          <div className="mt-5 flex items-baseline gap-1">
            <span className="font-heading text-h1 font-bold text-foreground">
              Rp 60.000
            </span>
            <span className="text-tiny text-muted-foreground">/bulan</span>
          </div>

          <div className="mt-3 rounded-xl border border-sage-soft-border bg-sage-soft px-3 py-1.5 font-mono text-tiny font-bold text-sage-text">
            👑 Unlimited PRD / bulan
          </div>

          <ul className="mt-5 space-y-2.5 text-tiny text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-sage-strong font-bold" />
              <span className="font-bold text-foreground">UNLIMITED PRD selama sebulan</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-sage-strong font-bold" />
              <span>Model AI Architect Kualitas Tertinggi</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-sage-strong font-bold" />
              <span>Bebas Kuota Breakdown Task Prompt</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-sage-strong font-bold" />
              <span>Ekspor Aturan Custom Multi-Repo</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-sage-strong font-bold" />
              <span>Priority Processing & Fast Support</span>
            </li>
          </ul>
        </div>

        <Link
          href="/subscription"
          className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-sunken px-4 py-2.5 text-tiny font-semibold text-foreground shadow-warm-xs transition-all duration-300 group-hover:bg-brand-strong group-hover:text-white group-hover:shadow-warm-sm"
        >
          Pilih Ultra <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
