import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#f7f5f0] text-foreground font-sans selection:bg-brand-soft selection:text-brand-stronger overflow-hidden">
      {/* Background Soft Ambient Glowing Lights */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#e8f0fe] via-[#f7f5f0] to-[#f7f5f0]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 size-[700px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-brand-soft/50 via-amber-soft/40 to-sage-soft/40 blur-3xl animate-pulse-glow"
      />

      {/* Top Header Bar */}
      <header className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="group transition-transform hover:scale-105">
          <Logo
            markClassName="shadow-warm-brand rounded-[10px] transition-transform group-hover:scale-105"
            wordmarkClassName="text-h3"
            gradientId="bvc-auth-header"
          />
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-2 text-tiny font-semibold text-muted-foreground shadow-warm-xs backdrop-blur-sm transition-all hover:bg-white hover:text-foreground hover:shadow-warm-sm"
        >
          <ArrowLeft className="size-3.5" />
          Kembali ke Beranda
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-6xl px-6 py-6 text-center text-tiny text-muted-foreground">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Sparkles className="size-3.5 text-brand-stronger" />
          <span>bisavibecoding — Lapisan Perencanaan AI untuk Vibe Coding yang Sekali Jalan Benar.</span>
        </div>
      </footer>
    </div>
  );
}
