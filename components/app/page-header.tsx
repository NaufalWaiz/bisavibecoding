import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
  meta,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-warm-xs sm:p-6",
        className,
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          {Icon ? (
            <span
              aria-hidden
              className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-brand-soft-border bg-brand-soft text-brand-strong shadow-warm-xs"
            >
              <Icon className="size-5.5" />
            </span>
          ) : null}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-soft-border bg-brand-soft/80 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-stronger">
                {eyebrow}
              </span>
            </div>
            <h2 className="mt-1.5 font-heading text-h2 tracking-tight text-foreground">
              {title}
            </h2>
            {description ? (
              <p className="mt-1.5 max-w-reading text-small text-muted-foreground leading-relaxed">
                {description}
              </p>
            ) : null}
            {meta ? <div className="mt-3">{meta}</div> : null}
          </div>
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:self-start">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
