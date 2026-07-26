import { cn } from "@/lib/utils";

/**
 * Identitas Visual bisavibecoding (Mathematical Symmetry & Iconic Character).
 *
 * Konsep: Layered Monogram "V" — Goresan ganda (Outer V & Inner V) yang 100% simetris
 * terhadap sumbu pusat (X = 16). Melambangkan "Layered AI Architecture" dan "Vibe Coding",
 * sangat tajam, seimbang, berkarakter kuat, dan indah di semua ukuran.
 */

function LogoGlyph({ className }: { className?: string }) {
  return (
    <g className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      {/* Outer Primary V Monogram (Symmetrical X=16) */}
      <path d="M 7.5 10.5 L 16 23 L 24.5 10.5" strokeWidth={3.2} />
      
      {/* Inner Nested V Layer (Symmetrical Architecture Layer) */}
      <path d="M 12 10.5 L 16 16.5 L 20 10.5" strokeWidth={2.2} opacity={0.9} />
    </g>
  );
}

/** Mark: Squircle Tile Bergradien Terracotta dengan Simetri Presisi. */
export function LogoMark({
  className,
  gradientId = "bvc-mark",
}: {
  className?: string;
  gradientId?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={32}
      height={32}
      role="img"
      aria-label="bisavibecoding"
      className={cn("size-8 shrink-0 drop-shadow-xs", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#BEF264" />
          <stop offset="60%" stopColor="#84CC16" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>

      {/* Main Squircle Tile */}
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      
      {/* 100% Symmetrical Dark Navy Monogram */}
      <LogoGlyph className="text-[#0F172A]" />
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
      className={cn("size-8 shrink-0 text-[#0F172A]", className)}
    >
      <LogoGlyph />
    </svg>
  );
}

/**
 * Wordmark: Tipografi bersih, modern & ramah.
 * Suku kata "vibe" disorot dengan warna lime/purple tebal.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-sans leading-none tracking-tight lowercase text-[#0F172A]",
        className,
      )}
    >
      bisa<span className="text-[#059669] font-extrabold">vibe</span>coding
    </span>
  );
}

/** Logo Lengkap: Mark + Wordmark. */
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
