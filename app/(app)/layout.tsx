import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { getCurrentUser } from "@/lib/supabase/server";
import { logout } from "../(auth)/actions";
import { Activity, CreditCard, LogOut } from "lucide-react";
import { LogoutButton } from "@/components/app/logout-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const userInitial = user.email ? user.email.charAt(0).toUpperCase() : "U";

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-warm-canvas">
      {/* Top Navbar */}
      <header className="surface-glass sticky top-0 z-40 border-b border-border/60 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-content items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link
              href="/projects"
              className="group flex items-center gap-2.5 transition-warm focus-visible:outline-none"
              title="Dashboard Project"
            >
              <Logo
                markClassName="rounded-lg transition-warm group-hover:scale-105"
                wordmarkClassName="text-[#0F172A] font-extrabold text-sm sm:text-h3 font-heading"
                gradientId="bvc-app-hdr"
              />
            </Link>

            <div className="hidden items-center gap-2 border-l border-border/60 pl-4 md:flex">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface-sunken/80 px-2.5 py-0.5 text-tiny font-medium text-muted-foreground">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <Activity className="size-3 text-emerald-500" />
                Vibe Engine Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Subscription Link */}
            <Link
              href="/subscription"
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-soft-border bg-brand-soft/80 px-2.5 sm:px-3 py-1 text-tiny font-bold text-brand-stronger shadow-warm-xs transition-warm hover:bg-brand-soft hover:shadow-warm-sm hover:scale-105"
            >
              <CreditCard className="size-3.5 text-brand-strong" />
              <span className="hidden sm:inline">Berlangganan</span>
              <span className="sm:hidden">Pro</span>
            </Link>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 rounded-full border border-border/90 bg-card px-2 py-1 text-tiny text-foreground shadow-warm-xs transition-warm hover:border-brand-strong/30 hover:shadow-warm-sm">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft border border-brand-soft-border font-mono text-[11px] font-bold text-brand-stronger leading-none shadow-warm-xs">
                {userInitial}
              </span>
              <span className="hidden max-w-[160px] truncate text-tiny font-semibold text-foreground tracking-tight sm:inline pr-1">
                {user.email}
              </span>
            </div>

            <form action={logout}>
              <LogoutButton />
            </form>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-content flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/60 bg-surface/30">
        <div className="mx-auto flex w-full max-w-content flex-col items-center justify-between gap-3 px-4 py-5 text-tiny text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">bisavibecoding</span>
            <span>—</span>
            <span>Planning architecture for AI vibe coding</span>
          </div>

          <div className="flex items-center gap-4 text-tiny">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Operational
            </span>
            <Link
              href="/projects"
              className="transition-warm hover:text-foreground"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
