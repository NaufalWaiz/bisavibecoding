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
  Lock,
  FileCode,
} from "lucide-react";

const MARQUEE_ITEMS = [
  { label: "Claude Code CLI", category: "Anthropic Agent", badge: "Direct Input", Icon: Terminal },
  { label: "Cursor IDE", category: "Vibe Coding Editor", badge: "Rules Ready", Icon: Code2 },
  { label: "Windsurf Cascade", category: "Codeium AI", badge: "Context Sliced", Icon: Cpu },
  { label: "PRD v1 Locked", category: "Single Source of Truth", badge: "Zero Drift", Icon: ShieldCheck },
  { label: "1 Task = 1 Prompt", category: "94%+ Success Rate", badge: "Sekali Jalan", Icon: Zap },
  { label: "Next.js 15 App Router", category: "Modern Stack", badge: "TypeScript 5", Icon: Layers },
  { label: "Supabase & Drizzle ORM", category: "Schema Preserved", badge: "Strict Types", Icon: CheckCircle2 },
  { label: "CLAUDE.md & Rules", category: "Repository Export", badge: "1-Click Copy", Icon: FileCode },
  { label: "Self-Contained Context", category: "No Spec Hallucination", badge: "Verified", Icon: Sparkles },
];

export function TechMarquee() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
    <div className="relative w-full overflow-hidden border-y border-border/70 bg-surface/70 py-5 shadow-warm-xs backdrop-blur-md">
      {/* Side Fade Gradient Masks */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-28 bg-gradient-to-r from-warm-canvas via-warm-canvas/80 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-28 bg-gradient-to-l from-warm-canvas via-warm-canvas/80 to-transparent" />

      <div className="flex w-max animate-marquee gap-5">
        {items.map((item, idx) => {
          const Icon = item.Icon;
          return (
            <div
              key={idx}
              className="group flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card/90 px-4.5 py-2.5 text-tiny shadow-warm-xs transition-all duration-300 hover:border-brand-strong/40 hover:bg-card hover:shadow-warm-md hover:scale-105"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-soft border border-brand-soft-border text-brand-strong transition-transform group-hover:scale-110">
                <Icon className="size-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground leading-tight tracking-tight">
                    {item.label}
                  </span>
                  <span className="rounded-full border border-sage-soft-border bg-sage-soft px-2 py-0.2 text-[9px] font-bold text-sage-text">
                    {item.badge}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  {item.category}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
