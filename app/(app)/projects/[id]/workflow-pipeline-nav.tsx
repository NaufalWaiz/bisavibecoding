"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Lock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildPipeline, type PipelineInput } from "@/lib/project-progress";

export function WorkflowPipelineNav({
  projectId,
  className,
  ...input
}: PipelineInput & { projectId: string; className?: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;
  const { steps } = buildPipeline(input);

  return (
    <nav
      aria-label="Alur pengerjaan"
      className={cn(
        "rounded-2xl border border-border/80 bg-surface-sunken/60 p-1.5 shadow-warm-xs backdrop-blur-sm",
        className,
      )}
    >
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {steps.map((step) => {
          const href = step.segment ? `${base}/${step.segment}` : base;
          const active = step.segment
            ? pathname.startsWith(`${base}/${step.segment}`)
            : pathname === base;
          const blocked = step.status === "blocked";
          const isDone = step.status === "done";
          const isWarn = step.status === "warn";

          return (
            <li key={step.key} className="min-w-0">
              <Link
                href={href}
                aria-current={active ? "step" : undefined}
                title={step.blockedReason ?? `${step.label}: ${step.detail}`}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-all duration-200",
                  active
                    ? "border-brand-strong/40 bg-card text-brand-stronger shadow-warm-sm ring-1 ring-brand-strong/20 font-bold"
                    : isDone
                      ? "border-sage-soft-border bg-sage-soft/60 text-sage-text hover:bg-sage-soft hover:border-sage-strong/40"
                      : isWarn
                        ? "border-amber-soft-border bg-amber-soft/60 text-amber-text hover:bg-amber-soft"
                        : blocked
                          ? "border-border/40 bg-surface-sunken/40 text-muted-foreground/60 cursor-not-allowed"
                          : "border-border/80 bg-card/80 text-foreground hover:bg-card hover:border-border-strong hover:shadow-warm-xs",
                )}
              >
                {/* Step Badge Indicator */}
                <span
                  aria-hidden
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-lg text-tiny font-bold font-mono transition-transform duration-200 group-hover:scale-105",
                    active
                      ? "bg-brand-strong text-white shadow-warm-xs"
                      : isDone
                        ? "bg-sage-strong text-white shadow-warm-xs"
                        : isWarn
                          ? "bg-amber text-white shadow-warm-xs"
                          : "bg-surface-sunken text-muted-foreground border border-border/60",
                  )}
                >
                  {isDone ? (
                    <Check className="size-3.5 stroke-[3]" />
                  ) : blocked ? (
                    <Lock className="size-3" />
                  ) : (
                    step.num
                  )}
                </span>

                {/* Step Text Info */}
                <span className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span
                    className={cn(
                      "truncate text-small font-semibold tracking-tight",
                      active
                        ? "text-brand-stronger font-bold"
                        : isDone
                          ? "text-sage-text"
                          : blocked
                            ? "text-muted-foreground/60"
                            : "text-foreground",
                    )}
                  >
                    {step.label}
                  </span>
                  <span className="truncate text-[11px] text-muted-foreground/80 mt-0.5 font-normal">
                    {step.blockedReason ?? step.detail}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
