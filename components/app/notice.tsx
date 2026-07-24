import { AlertTriangle, Info, ShieldCheck, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "info" | "warning" | "success" | "danger";

/**
 * Banner pemberitahuan sebaris.
 *
 * Sebelumnya tiap halaman menulis banner-nya sendiri dengan warna Tailwind
 * mentah (`amber-500/5`, `emerald-600`) yang tidak ada di token — hasilnya
 * dingin dan menabrak kanvas hangat. Semua tone di sini memakai pasangan
 * tint/teks dari `globals.css` supaya kontrasnya konsisten.
 */
const TONE: Record<
  Tone,
  { wrap: string; icon: string; Icon: typeof Info }
> = {
  info: {
    wrap: "border-border bg-surface-sunken/70 text-foreground",
    icon: "text-brand-strong",
    Icon: Info,
  },
  warning: {
    wrap: "border-amber-soft-border bg-amber-soft/70 text-amber-text",
    icon: "text-amber",
    Icon: AlertTriangle,
  },
  success: {
    wrap: "border-sage-soft-border bg-sage-soft/70 text-sage-text",
    icon: "text-sage-strong",
    Icon: ShieldCheck,
  },
  danger: {
    wrap: "border-danger-soft-border bg-danger-soft/70 text-danger",
    icon: "text-danger",
    Icon: XCircle,
  },
};

export function Notice({
  tone = "info",
  title,
  children,
  action,
  className,
}: {
  tone?: Tone;
  title?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  const { wrap, icon, Icon } = TONE[tone];

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border px-4 py-3 text-tiny shadow-warm-xs sm:flex-row sm:items-center sm:justify-between",
        wrap,
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <Icon className={cn("mt-px size-4 shrink-0", icon)} />
        <div className="min-w-0 leading-relaxed">
          {title ? <p className="font-semibold">{title}</p> : null}
          {children}
        </div>
      </div>
      {action ? <div className="shrink-0 sm:pl-3">{action}</div> : null}
    </div>
  );
}
