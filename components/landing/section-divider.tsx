import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionDivider({
  label,
  icon: Icon = Sparkles,
  className,
}: {
  label?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div className={cn("relative flex w-full items-center justify-center py-6", className)}>
      {/* Background Horizontal Line with Gradient Fade */}
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-brand-strong/30 to-transparent" />
      </div>

      {label ? (
        <div className="relative flex items-center gap-2 rounded-full border border-brand-soft-border bg-card px-4 py-1 text-tiny font-bold uppercase tracking-wider text-brand-stronger shadow-warm-xs backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-brand-strong/40">
          <span className="flex size-4 items-center justify-center rounded-full bg-brand-soft text-brand-strong">
            <Icon className="size-2.5" />
          </span>
          <span>{label}</span>
        </div>
      ) : null}
    </div>
  );
}
