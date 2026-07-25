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
  { label: "Claude Code CLI", category: "Anthropic Agent", badge: "Direct Input", Icon: Terminal },
  { label: "Cursor IDE", category: "Vibe Coding", badge: "Rules Ready", Icon: Code2 },
  { label: "Windsurf Agent", category: "Codeium AI", badge: "Context Sliced", Icon: Cpu },
  { label: "PRD v1 Locked", category: "Single Source of Truth", badge: "Zero Drift", Icon: ShieldCheck },
  { label: "1 Task = 1 Prompt", category: "Sekali Jalan Benar", badge: "94%+ Success", Icon: Zap },
  { label: "Next.js 15 App Router", category: "Core Framework", badge: "TypeScript 5", Icon: Layers },
  { label: "Supabase & Drizzle", category: "Database Stack", badge: "Strict Types", Icon: CheckCircle2 },
  { label: "CLAUDE.md & Rules", category: "Repository Export", badge: "1-Click Copy", Icon: FileCode },
  { label: "Self-Contained Context", category: "No Spec Hallucination", badge: "Verified", Icon: Sparkles },
];

export function TechMarquee() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
    <div className="relative w-full overflow-hidden border-y border-border/60 bg-surface-sunken/40 py-3.5 backdrop-blur-sm">
      {/* Side Fade Gradient Masks */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-warm-canvas via-warm-canvas/70 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-warm-canvas via-warm-canvas/70 to-transparent" />

      <div className="flex w-max items-center gap-4 animate-marquee">
        {items.map((item, idx) => {
          const Icon = item.Icon;
          return (
            <div
              key={idx}
              className="group flex h-11 shrink-0 items-center gap-3 rounded-xl border border-border/80 bg-card px-3.5 py-2 text-tiny shadow-warm-xs transition-all duration-300 hover:border-brand-strong/40 hover:shadow-warm-sm hover:scale-105"
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-soft border border-brand-soft-border text-brand-strong">
                <Icon className="size-3.5" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground tracking-tight whitespace-nowrap">
                  {item.label}
                </span>
                <span className="rounded-md border border-sage-soft-border bg-sage-soft px-2 py-0.5 font-mono text-[10px] font-bold text-sage-text whitespace-nowrap">
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
