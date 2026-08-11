"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles, Zap, Flame, Crown, ArrowRight, Gift } from "lucide-react";

export function PricingCards() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  return (
    <div className="space-y-12">
      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-xs font-bold ${billingCycle === "monthly" ? "text-[#0F172A]" : "text-slate-500"}`}>
          Bulanan
        </span>
        <button
          onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")}
          className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-slate-200 transition-colors duration-200 ease-in-out focus:outline-none"
        >
          <span
            className={`pointer-events-none inline-block size-5 transform rounded-full bg-[#0F172A] shadow-md ring-0 transition duration-200 ease-in-out ${
              billingCycle === "annual" ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <span className={`text-xs font-bold flex items-center gap-1.5 ${billingCycle === "annual" ? "text-[#0F172A]" : "text-slate-500"}`}>
          Tahunan
          <span className="rounded-full bg-[#BEF264] px-2.5 py-0.5 text-[10px] font-extrabold text-[#0F172A]">
            Hemat 20%
          </span>
        </span>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
        {/* 0. FREE PLAN */}
        <div className="rounded-[2rem] p-1.5 bg-slate-200/50 border border-slate-200/80 shadow-xs hover:border-[#BEF264] transition-all flex flex-col justify-between">
          <div className="rounded-[calc(2rem-0.375rem)] bg-white p-5 sm:p-6 border border-slate-100 shadow-sm flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  <Gift className="size-3 text-slate-500" /> Free
                </span>
                <span className="font-mono text-xs font-bold text-slate-400">00</span>
              </div>

              <h3 className="mt-5 text-xl font-extrabold text-[#0F172A]">Free Plan</h3>
              <p className="mt-1 text-xs text-slate-500">
                Untuk uji coba pertama kali & eksplorasi alur kerja.
              </p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-[#0F172A]">Rp 0</span>
                <span className="text-xs text-slate-500">/selamanya</span>
              </div>

              <div className="mt-3 rounded-xl bg-slate-100 px-3 py-1.5 font-mono text-xs font-bold text-[#0F172A]">
                🎁 3 PRD / bulan
              </div>

              <ul className="mt-6 space-y-3 text-xs text-slate-600">
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 text-[#059669] font-bold" />
                  <span>3 PRD terstruktur per bulan</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 text-[#059669] font-bold" />
                  <span>Basic Task Breakdown Prompts</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 text-[#059669] font-bold" />
                  <span>Ekspor aturan CLAUDE.md dasar</span>
                </li>
              </ul>
            </div>

            <Link
              href="/register"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-100 px-4 py-3 text-xs font-bold text-[#0F172A] transition-colors hover:bg-slate-200"
            >
              Coba Gratis <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* 1. STARTER PLAN */}
        <div className="rounded-[2rem] p-1.5 bg-slate-200/50 border border-slate-200/80 shadow-xs hover:border-[#BEF264] transition-all flex flex-col justify-between">
          <div className="rounded-[calc(2rem-0.375rem)] bg-white p-5 sm:p-6 border border-slate-100 shadow-sm flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-50 border border-lime-200 px-3 py-1 text-xs font-bold text-[#3F6212]">
                  <Zap className="size-3 text-[#3F6212]" /> Starter
                </span>
                <span className="font-mono text-xs font-bold text-slate-400">01</span>
              </div>

              <h3 className="mt-5 text-xl font-extrabold text-[#0F172A]">Starter Plan</h3>
              <p className="mt-1 text-xs text-slate-500">
                Cocok untuk solo developer & indie hacker awal.
              </p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-[#0F172A]">
                  {billingCycle === "annual" ? "Rp 12.000" : "Rp 15.000"}
                </span>
                <span className="text-xs text-slate-500">/bulan</span>
              </div>

              <div className="mt-3 rounded-xl bg-[#F7FEE7] px-3 py-1.5 font-mono text-xs font-bold text-[#3F6212]">
                ⚡ 20 PRD / bulan
              </div>

              <ul className="mt-6 space-y-3 text-xs text-slate-600">
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 text-[#059669] font-bold" />
                  <span>20 PRD terstruktur per bulan</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 text-[#059669] font-bold" />
                  <span>Unlimited Task Prompts</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 text-[#059669] font-bold" />
                  <span>Ekspor aturan CLAUDE.md & rules</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 text-[#059669] font-bold" />
                  <span>Dukungan Claude Code, Cursor & Windsurf</span>
                </li>
              </ul>
            </div>

            <Link
              href="/register"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-100 px-4 py-3 text-xs font-bold text-[#0F172A] transition-colors hover:bg-slate-200"
            >
              Pilih Starter <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* 2. PRO PLAN (RECOMMENDED) */}
        <div className="rounded-[2rem] p-1.5 bg-linear-to-br from-[#BEF264] via-emerald-400 to-[#15803D] shadow-xl flex flex-col justify-between transform lg:-translate-y-2 relative">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#BEF264] px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#0F172A] shadow-md border border-[#0F172A]/20">
              <Flame className="size-3 text-[#0F172A] fill-[#0F172A]" /> Paling Populer
            </span>
          </div>

          <div className="rounded-[calc(2rem-0.375rem)] bg-[#0F172A] p-6 text-white shadow-sm flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-[#BEF264]">
                  <Sparkles className="size-3 text-[#BEF264]" /> Pro
                </span>
                <span className="font-mono text-xs font-bold text-slate-400">02</span>
              </div>

              <h3 className="mt-5 text-xl font-extrabold text-white">Pro Plan</h3>
              <p className="mt-1 text-xs text-slate-300">
                Untuk vibe coder aktif & builder berkecepatan tinggi.
              </p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">
                  {billingCycle === "annual" ? "Rp 24.000" : "Rp 30.000"}
                </span>
                <span className="text-xs text-slate-300">/bulan</span>
              </div>

              <div className="mt-3 rounded-xl bg-[#BEF264] text-[#0F172A] px-3 py-1.5 font-mono text-xs font-extrabold shadow-sm">
                🔥 50 PRD / bulan
              </div>

              <ul className="mt-6 space-y-3 text-xs text-slate-200">
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 text-[#BEF264] font-bold" />
                  <span className="font-bold">50 PRD terstruktur per bulan</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 text-[#BEF264] font-bold" />
                  <span>Akses Premium AI Architect Engine</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 text-[#BEF264] font-bold" />
                  <span>PRD Lock & Unlimited Versioning</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 text-[#BEF264] font-bold" />
                  <span>Fast-track Task Breakdown Prompts</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 text-[#BEF264] font-bold" />
                  <span>Ekspor Lengkap Aturan Repo</span>
                </li>
              </ul>
            </div>

            <Link
              href="/register"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#BEF264] px-4 py-3 text-xs font-extrabold text-[#0F172A] shadow-md transition-all hover:bg-[#a3e635] hover:scale-[1.02]"
            >
              Pilih Pro Sekarang <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* 3. ULTRA PLAN */}
        <div className="rounded-[2rem] p-1.5 bg-slate-200/50 border border-slate-200/80 shadow-xs hover:border-[#BEF264] transition-all flex flex-col justify-between">
          <div className="rounded-[calc(2rem-0.375rem)] bg-white p-5 sm:p-6 border border-slate-100 shadow-sm flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-[#059669]">
                  <Crown className="size-3 text-[#059669]" /> Ultra
                </span>
                <span className="font-mono text-xs font-bold text-slate-400">03</span>
              </div>

              <h3 className="mt-5 text-xl font-extrabold text-[#0F172A]">Ultra Plan</h3>
              <p className="mt-1 text-xs text-slate-500">
                Performa tanpa batas untuk studio & agency.
              </p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-[#0F172A]">
                  {billingCycle === "annual" ? "Rp 48.000" : "Rp 60.000"}
                </span>
                <span className="text-xs text-slate-500">/bulan</span>
              </div>

              <div className="mt-3 rounded-xl bg-emerald-50 text-[#059669] px-3 py-1.5 font-mono text-xs font-bold border border-emerald-200">
                👑 Unlimited PRD / bulan
              </div>

              <ul className="mt-6 space-y-3 text-xs text-slate-600">
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 text-[#059669] font-bold" />
                  <span className="font-bold text-[#0F172A]">UNLIMITED PRD selama sebulan</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 text-[#059669] font-bold" />
                  <span>Model AI Architect Kualitas Tertinggi</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 text-[#059669] font-bold" />
                  <span>Bebas Kuota Breakdown Task Prompt</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 text-[#059669] font-bold" />
                  <span>Ekspor Aturan Custom Multi-Repo</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 text-[#059669] font-bold" />
                  <span>Priority Processing & Fast Support</span>
                </li>
              </ul>
            </div>

            <Link
              href="/register"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-100 px-4 py-3 text-xs font-bold text-[#0F172A] transition-colors hover:bg-slate-200"
            >
              Pilih Ultra <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
