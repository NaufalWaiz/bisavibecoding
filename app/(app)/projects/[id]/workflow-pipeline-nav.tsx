"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Lock } from "lucide-react";
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
        "rounded-2xl border border-border/80 bg-surface-sunken/60 p-1.5 shadow-warm-xs backdrop-blur-sm overflow-x-auto no-scrollbar",
        className,
      )}
    >
      <ol className="grid grid-cols-2 gap-1.5 sm:gap-2 sm:grid-cols-4 min-w-[280px]">
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
                aria-disabled={blocked}
                tabIndex={blocked ? -1 : undefined}
                onClick={(e) => {
                  if (blocked) e.preventDefault();
                }}
                title={step.blockedReason ?? `${step.label}: ${step.detail}`}
                className={cn(
                  "group relative flex items-center gap-2 sm:gap-3 rounded-xl bg-card px-2.5 sm:px-3.5 py-2 sm:py-2.5 transition-all duration-200",
                  active
                    ? "border-2 border-brand-strong ring-2 ring-brand-strong/20 shadow-warm-sm font-bold"
                    : blocked
                      ? "border border-border/40 bg-surface-sunken/40 text-muted-foreground/60 cursor-not-allowed opacity-60"
                      : isWarn
                        ? "border border-amber-soft-border hover:bg-surface-raised hover:border-amber/50 hover:shadow-warm-xs"
                        : "border border-border/80 hover:bg-surface-raised hover:border-border-strong hover:shadow-warm-xs",
                )}
              >
                {/* Step Badge Indicator */}
                <span
                  aria-hidden
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-lg text-tiny font-bold font-mono transition-transform duration-200 group-hover:scale-105",
                    isDone
                      ? "bg-brand-strong text-white shadow-warm-xs"
                      : isWarn
                        ? "bg-amber text-white shadow-warm-xs"
                        : "bg-surface-sunken text-muted-foreground border border-border/60",
                  )}
                >
                  {isDone ? (
                    <Check className="size-3.5 stroke-[3]" />
                  ) : blocked ? (
                    <Lock className="size-3 text-muted-foreground/70" />
                  ) : (
                    step.num
                  )}
                </span>

                {/* Step Text Info */}
                <span className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span
                    className={cn(
                      "truncate text-small tracking-tight transition-colors",
                      active
                        ? "text-brand-stronger font-bold"
                        : blocked
                          ? "text-muted-foreground/70 font-medium"
                          : "text-foreground font-semibold group-hover:text-brand-stronger",
                    )}
                  >
                    {step.label}
                  </span>
                  <span
                    className={cn(
                      "truncate text-[11px] mt-0.5 font-normal transition-colors",
                      active
                        ? "text-brand-strong/90 font-semibold"
                        : isWarn
                          ? "text-amber-text font-medium"
                          : "text-muted-foreground",
                    )}
                  >
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
