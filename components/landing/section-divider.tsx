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
        <div className="h-px w-full bg-linear-to-r from-transparent via-[#BEF264]/40 to-transparent" />
      </div>

      {label ? (
        <div className="relative flex items-center gap-2 rounded-full border border-[#D9F99D] bg-white px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-[#3F6212] shadow-xs backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-[#BEF264]">
          <span className="flex size-5 items-center justify-center rounded-full bg-[#F7FEE7] text-[#3F6212]">
            <Icon className="size-2.5" />
          </span>
          <span>{label}</span>
        </div>
      ) : null}
    </div>
  );
}
