import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Keadaan kosong yang seragam di semua halaman.
 *
 * `hint` sengaja terpisah dari `description`: yang pertama menjelaskan apa yang
 * belum ada, yang kedua memberi tahu langkah berikutnya. Keadaan kosong yang
 * tidak menyebutkan langkah berikutnya adalah jalan buntu.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  hint,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  hint?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "animate-fade-up relative overflow-hidden rounded-2xl border border-dashed border-border-strong bg-card/50 px-6 py-14 text-center shadow-warm-xs",
        className,
      )}
    >
      {/* Lingkaran tint di belakang ikon — memberi titik fokus tanpa ilustrasi. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-10 size-40 -translate-x-1/2 rounded-full bg-brand-soft/50 blur-3xl"
      />

      <div className="relative">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-border bg-surface-sunken text-brand-strong shadow-warm-xs">
          <Icon className="size-6" />
        </span>

        <h3 className="mt-5 font-heading text-h3 text-foreground">{title}</h3>

        {description ? (
          <p className="mx-auto mt-2 max-w-reading text-small text-muted-foreground">
            {description}
          </p>
        ) : null}

        {action ? <div className="mt-6 flex justify-center">{action}</div> : null}

        {hint ? (
          <div className="mx-auto mt-5 max-w-reading text-tiny text-muted-foreground">
            {hint}
          </div>
        ) : null}
      </div>
    </div>
  );
}
