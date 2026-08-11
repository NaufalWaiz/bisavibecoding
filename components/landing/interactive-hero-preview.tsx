"use client";

import { useState } from "react";
import { Sparkles, Check, Copy, Terminal, MessageSquare, ShieldCheck, Lock, Zap } from "lucide-react";

const STAGES = [
  {
    id: "idea",
    tabLabel: "1. Ide Mentah",
    badge: "Input User",
    title: "Percakapan Intake Awal",
    icon: MessageSquare,
    content: (
      <div className="flex flex-col gap-3 font-sans text-sm">
        <div className="ml-auto max-w-[90%] rounded-2xl rounded-tr-xs border border-[#BEF264] bg-[#F7FEE7] p-4 text-[#0F172A] shadow-xs">
          <p className="font-bold text-xs text-[#3F6212] mb-1">User Input:</p>
          &quot;Saya mau buat SaaS invoicing simpel untuk freelancer. Ada fitur buat invoice PDF, daftar klien, dan laporan bulanan.&quot;
        </div>
      </div>
    ),
  },
  {
    id: "clarify",
    tabLabel: "2. Klarifikasi AI",
    badge: "2-3 Pertanyaan Tajam",
    title: "AI Architect Clarification",
    icon: Sparkles,
    content: (
      <div className="flex flex-col gap-3 font-sans text-sm">
        <div className="rounded-2xl rounded-tl-xs border border-emerald-200 bg-emerald-50/70 p-4 shadow-xs">
          <p className="font-bold text-xs uppercase tracking-wider text-[#059669] flex items-center gap-1.5 mb-2">
            <Sparkles className="size-3.5 text-[#059669]" /> AI Architect (3 Pertanyaan Arsitektur):
          </p>
          <ol className="list-decimal space-y-1.5 pl-5 text-slate-700 text-xs sm:text-sm">
            <li>Apakah format penomoran invoice bisa di-custom per user?</li>
            <li>Apakah status pembayaran mendukung sistem DP / cicilan?</li>
            <li>Apakah laporan bulanan perlu ekspor ke Excel / CSV?</li>
          </ol>
        </div>
      </div>
    ),
  },
  {
    id: "prd",
    tabLabel: "3. PRD Locked",
    badge: "PRD v1.0 Locked",
    title: "Single Source of Truth",
    icon: ShieldCheck,
    content: (
      <div className="flex flex-col gap-3 font-mono text-xs">
        <div className="flex items-center justify-between rounded-xl border border-lime-300 bg-[#F7FEE7] px-4 py-2.5 text-[#0F172A]">
          <span className="font-bold flex items-center gap-1.5">
            <Lock className="size-4 text-[#3F6212]" /> PRD v1.0 Terkunci & Valid
          </span>
          <span className="text-[11px] font-bold text-[#059669] bg-emerald-100/80 px-2.5 py-0.5 rounded-full">3 Entitas DB · 4 Fitur Inti</span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-4 text-slate-200 shadow-inner">
          <p className="font-bold text-[#BEF264]"># 1. SPECIFICATION SUMMARY: SAAS INVOICING ENGINE</p>
          <p className="mt-1.5 text-slate-300 text-[11px]">
            Target: Single Source of Truth for AI Agents (Claude Code / Cursor / Windsurf)
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "prompt",
    tabLabel: "4. Prompt Final",
    badge: "Sekali Jalan Benar",
    title: "Prompt Task Agent Siap Tempel",
    icon: Terminal,
    content: (
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0F172A] text-slate-100 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#1E293B] px-4 py-2 font-mono text-xs text-slate-400">
          <span>final_task_prompt_03.md</span>
          <span className="text-[#BEF264] font-semibold flex items-center gap-1">
            <Check className="size-3.5" /> Ready for CLI Agent
          </span>
        </div>
        <pre className="p-4 font-mono text-xs leading-relaxed text-slate-200 whitespace-pre-wrap">
          <span className="text-[#059669]">## TUJUAN TASK #03</span>{"\n"}
          Buat komponen `InvoiceForm` & generator PDF stream...{"\n"}
          <span className="text-[#059669]">## KONTEKS RELEVAN</span>{"\n"}
          Entity: Invoice, InvoiceItem, Client...{"\n"}
          <span className="text-[#BEF264]">## ACCEPTANCE CRITERIA</span>{"\n"}
          ✓ Invoice bisa diekspor PDF dengan margin rapi tanpa bug.
        </pre>
      </div>
    ),
  },
];

export function InteractiveHeroPreview() {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const stage = STAGES[activeTab];

  return (
    <div className="relative">
      {/* Radiant Glow Behind Window */}
      <div
        aria-hidden
        className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-linear-to-r from-[#BEF264]/30 via-emerald-500/15 to-[#BEF264]/20 blur-2xl opacity-80"
      />

      {/* Floating Pill Badges */}
      <div
        aria-hidden
        className="absolute -top-5 -left-6 z-20 hidden rounded-2xl border border-lime-300 bg-[#BEF264] px-4 py-2 text-xs font-extrabold text-[#0F172A] shadow-md lg:flex items-center gap-1.5 -rotate-2"
      >
        <Lock className="size-3.5 text-[#0F172A]" /> PRD v1 Terkunci
      </div>

      <div
        aria-hidden
        className="absolute -bottom-5 -right-6 z-20 hidden rounded-2xl border border-emerald-300 bg-[#0F172A] px-4 py-2 text-xs font-bold text-[#BEF264] shadow-md lg:flex items-center gap-1.5 rotate-2"
      >
        <Zap className="size-3.5 text-[#BEF264]" /> Task Self-Contained
      </div>

      {/* Main Preview Card Window */}
      <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-2xl transition-all">
        {/* Top Window Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-rose-400" />
            <span className="size-3 rounded-full bg-amber-400" />
            <span className="size-3 rounded-full bg-[#BEF264]" />
            <span className="ml-2 font-mono text-xs font-semibold text-slate-500">
              bisavibecoding // Live Workspace Simulator
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#BEF264] px-3.5 py-1 text-xs font-extrabold text-[#0F172A]">
              <Sparkles className="size-3 text-[#0F172A]" /> Step {activeTab + 1} of 4
            </span>
          </div>
        </div>

        {/* Interactive Stage Progress Bar */}
        <div className="w-full bg-slate-100 h-1">
          <div
            className="bg-[#0F172A] h-1 transition-all duration-500 ease-out"
            style={{ width: `${((activeTab + 1) / STAGES.length) * 100}%` }}
          />
        </div>

        {/* Interactive Tabs Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 border-b border-slate-100 bg-slate-50/50 p-1.5 sm:p-2">
          {STAGES.map((s, idx) => {
            const Icon = s.icon;
            const isActive = activeTab === idx;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl px-2 py-2 sm:px-3 sm:py-2.5 text-[11px] sm:text-xs font-bold transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "bg-[#0F172A] text-white shadow-sm scale-[1.01]"
                    : "text-slate-500 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <Icon className={`size-3.5 shrink-0 ${isActive ? "text-[#BEF264]" : "text-slate-400"}`} />
                <span className="truncate">{s.tabLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Active Stage Body with Smooth Transition Effect */}
        <div className="p-6 sm:p-8 text-left">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-base sm:text-lg font-extrabold text-[#0F172A] flex items-center gap-2">
              {stage.title}
            </h4>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-[#059669]">
              {stage.badge}
            </span>
          </div>

          <div className="min-h-44 transition-all duration-300 ease-in-out">{stage.content}</div>

          {/* Action Bar Footer */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
            <span>Klik tab di atas untuk mensimulasikan alur 4 langkah.</span>
            {activeTab === 3 ? (
              <button
                onClick={() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#BEF264] px-5 py-2 text-xs font-extrabold text-[#0F172A] shadow-sm transition-all hover:bg-[#a3e635] hover:scale-105 cursor-pointer"
              >
                {copied ? <Check className="size-3.5 text-[#0F172A]" /> : <Copy className="size-3.5" />}
                <span>{copied ? "Prompt Disalin!" : "Salin Prompt Final"}</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
