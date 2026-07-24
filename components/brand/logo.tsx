import { cn } from "@/lib/utils";

/**
 * Identitas visual bisavibecoding.
 *
 * Konsep: monogram "v" — suku kata yang juga disorot di wordmark
 * (bisa·**vibe**·coding), jadi mark dan nama saling menjelaskan.
 *
 * Dibuat dari SATU goresan geometris dengan ujung membulat: cukup elegan di
 * ukuran besar, dan tetap terbaca di 16px (varian gelombang dan yang
 * memakai titik percikan sempat dicoba, keduanya lumer jadi bercak di
 * ukuran favicon).
 *
 * Tile-nya memakai radius sebahasa dengan kartu, dan gradiennya membaca token
 * warna lewat `var(--brand…)` sehingga logo ikut berubah kalau palet disetel
 * ulang.
 */

/** Goresan inti: monogram "v". Mewarisi `currentColor`. */
function LogoGlyph({ className }: { className?: string }) {
  return (
    <path
      className={className}
      d="M9.5 9 L16 22.5 L22.5 9"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

/** Mark: goresan di dalam tile bergradien hangat. */
export function LogoMark({
  className,
  gradientId = "bvc-mark",
}: {
  className?: string;
  /** Wajib unik kalau ada >1 mark dalam satu halaman. */
  gradientId?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={32}
      height={32}
      role="img"
      aria-label="bisavibecoding"
      className={cn("size-8 shrink-0", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="var(--brand)" />
          <stop offset="55%" stopColor="var(--brand-strong)" />
          <stop offset="100%" stopColor="var(--brand-stronger)" />
        </linearGradient>
      </defs>

      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      <LogoGlyph className="text-primary-foreground" />
    </svg>
  );
}

/** Mark versi polos — untuk latar gelap/terang tanpa tile. */
export function LogoMarkPlain({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={32}
      height={32}
      role="img"
      aria-label="bisavibecoding"
      className={cn("size-8 shrink-0 text-brand-strong", className)}
    >
      <LogoGlyph />
    </svg>
  );
}

/**
 * Wordmark. Huruf kecil semua supaya terasa ramah, dengan suku kata "vibe"
 * diberi warna aksen — sekaligus menjelaskan asal namanya.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-heading leading-none tracking-tight lowercase",
        className,
      )}
    >
      bisa<span className="text-brand-stronger">vibe</span>coding
    </span>
  );
}

/** Kunci logo lengkap: mark + wordmark. */
export function Logo({
  className,
  markClassName,
  wordmarkClassName,
  gradientId,
}: {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  gradientId?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} gradientId={gradientId} />
      <Wordmark className={wordmarkClassName} />
    </span>
  );
}
