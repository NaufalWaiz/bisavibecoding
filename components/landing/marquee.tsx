"use client";

import {
  Code2,
  Terminal,
  Cpu,
  ShieldCheck,
  Zap,
  Sparkles,
  Layers,
  CheckCircle2,
  FileCode,
} from "lucide-react";

const MARQUEE_ITEMS = [
  { label: "Claude Code CLI", badge: "Direct Input", Icon: Terminal },
  { label: "Cursor IDE", badge: "Rules Ready", Icon: Code2 },
  { label: "Windsurf Agent", badge: "Context Sliced", Icon: Cpu },
  { label: "PRD v1 Locked", badge: "Zero Drift", Icon: ShieldCheck },
  { label: "1 Task = 1 Prompt", badge: "94%+ Success", Icon: Zap },
  { label: "Next.js 15 App Router", badge: "TypeScript 5", Icon: Layers },
  { label: "Supabase & Drizzle", badge: "Strict Types", Icon: CheckCircle2 },
  { label: "CLAUDE.md & Rules", badge: "1-Click Copy", Icon: FileCode },
  { label: "Self-Contained Context", badge: "Verified", Icon: Sparkles },
];

export function TechMarquee() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
    <div className="relative w-full overflow-hidden border-y border-slate-200/60 bg-slate-50/60 py-3.5 backdrop-blur-sm">
      {/* Side Fade Gradient Masks */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-linear-to-r from-[#F8FAFC] via-[#F8FAFC]/80 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-linear-to-l from-[#F8FAFC] via-[#F8FAFC]/80 to-transparent" />

      <div className="flex w-max items-center gap-4 animate-marquee">
        {items.map((item, idx) => {
          const Icon = item.Icon;
          return (
            <div
              key={idx}
              className="group flex h-11 shrink-0 items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs shadow-xs transition-all duration-300 hover:border-[#BEF264]/60 hover:shadow-md hover:scale-105"
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#F7FEE7] border border-[#D9F99D] text-[#3F6212]">
                <Icon className="size-3.5" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#0F172A] tracking-tight whitespace-nowrap">
                  {item.label}
                </span>
                <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-[#059669] whitespace-nowrap">
                  {item.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
