"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  CheckCircle2,
  Sparkles,
  Terminal,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthState } from "./actions";

type Props = {
  mode: "login" | "register";
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  next?: string;
};

const COPY = {
  login: {
    title: "Selamat datang kembali",
    subtitle: "Masuk ke akunmu untuk melanjutkan perencanaan project.",
    submit: "Masuk ke Dashboard",
    altText: "Belum memiliki akun?",
    altHref: "/register",
    altLabel: "Daftar Akun Baru",
  },
  register: {
    title: "Mulai dari satu kalimat ide",
    subtitle: "Buat akun gratis untuk merencanakan project pertamamu.",
    submit: "Buat Akun Gratis",
    altText: "Sudah memiliki akun?",
    altHref: "/login",
    altLabel: "Masuk Akun",
  },
} as const;

import { triggerNavProgress } from "@/components/ui/navigation-progress";

function SubmitButton({ label, isLogin }: { label: string; isLogin: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={() => triggerNavProgress()}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1c1917] px-6 text-small font-semibold text-white shadow-warm-md transition-all duration-300 hover:bg-[#322c27] hover:shadow-warm-lg hover:scale-[1.02] disabled:opacity-75 cursor-pointer"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin text-brand" />
          <span>{isLogin ? "Memproses Masuk ke Dashboard…" : "Memproses Pendaftaran Akun…"}</span>
        </>
      ) : (
        <>
          <span>{label}</span>
          {isLogin ? <LogIn className="size-4" /> : <UserPlus className="size-4" />}
        </>
      )}
    </button>
  );
}

export function AuthForm({ mode, action, next }: Props) {
  const [state, formAction] = useActionState<AuthState, FormData>(action, {
    error: null,
  });
  const copy = COPY[mode];
  const isLogin = mode === "login";

  return (
    <div className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-black/10 bg-white shadow-warm-lg transition-all duration-500 hover:shadow-warm-brand/20">
      <div className="grid lg:grid-cols-12 min-h-[520px]">
        {/* Left Visual Banner Showcase Panel */}
        <div className="lg:col-span-5 relative flex flex-col justify-between overflow-hidden bg-[#1c1917] p-8 text-white">
          {/* Ambient Glowing Spot */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-gradient-to-br from-brand/40 via-amber/20 to-transparent blur-3xl"
          />

          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3.5 py-1 text-tiny font-semibold text-[#f4ece1] backdrop-blur-md">
              <Sparkles className="size-3.5 text-brand-strong" />
              bisavibecoding v1.0
            </span>

            <h2 className="mt-6 font-heading text-[2rem] font-normal leading-tight text-[#f4ece1]">
              Vibe coding tanpa <span className="font-semibold text-brand">halusinasi AI</span>.
            </h2>
            <p className="mt-3 text-small text-[#b3a596] leading-relaxed">
              Ubah ide produkmu menjadi task-task mandiri yang membawa konteksnya sendiri.
            </p>

            <ul className="mt-8 space-y-3.5 text-tiny text-[#f4ece1]">
              {[
                "PRD locked sebagai single source of truth",
                "Context-attached prompt untuk Claude & Cursor",
                "Detektor otomatis untuk Stale Task",
              ].map((feat) => (
                <li key={feat} className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 shrink-0 text-sage-strong" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Mini Live Prompt Snippet Mockup */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-[#2b2521] p-4 text-tiny font-mono text-[#b3a596] shadow-warm-md">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[11px]">
              <span className="flex items-center gap-1.5 text-[#f4ece1]">
                <Terminal className="size-3.5 text-brand" /> final_prompt.md
              </span>
              <span className="text-sage-strong font-semibold">Ready to Paste</span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-[#f4ece1]/80 line-clamp-2">
              ## TUJUAN TASK #01{"\n"}Implementasikan schema database & auth Supabase.
            </p>
          </div>
        </div>

        {/* Right Auth Form Area */}
        <div className="lg:col-span-7 flex flex-col justify-center p-8 sm:p-10 bg-white">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center rounded-2xl border border-black/5 bg-[#faf8f5] p-1 text-tiny font-semibold mb-8">
            <Link
              href="/login"
              onClick={() => triggerNavProgress()}
              className={`flex-1 text-center py-2.5 rounded-xl transition-all duration-200 ${
                isLogin
                  ? "bg-white text-foreground shadow-warm-xs font-bold border border-black/5"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Masuk Akun
            </Link>
            <Link
              href="/register"
              onClick={() => triggerNavProgress()}
              className={`flex-1 text-center py-2.5 rounded-xl transition-all duration-200 ${
                !isLogin
                  ? "bg-white text-foreground shadow-warm-xs font-bold border border-black/5"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Daftar Baru
            </Link>
          </div>

          <div>
            <h3 className="font-heading text-h1 text-foreground">{copy.title}</h3>
            <p className="mt-1.5 text-small text-muted-foreground">{copy.subtitle}</p>
          </div>

          <form action={formAction} className="mt-8 space-y-5">
            {next ? <input type="hidden" name="next" value={next} /> : null}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-tiny font-semibold text-foreground">
                Alamat Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="nama@email.com"
                  className="h-12 pl-10 pr-4 text-small rounded-2xl border-black/10 bg-[#faf8f5] focus:bg-white focus:border-brand-strong focus:ring-2 focus:ring-brand-soft"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-tiny font-semibold text-foreground">
                  Kata Sandi
                </Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  minLength={8}
                  placeholder="Minimal 8 karakter"
                  className="h-12 pl-10 pr-4 text-small rounded-2xl border-black/10 bg-[#faf8f5] focus:bg-white focus:border-brand-strong focus:ring-2 focus:ring-brand-soft"
                />
              </div>
            </div>

            {state.error ? (
              <div
                role="alert"
                className="flex items-center gap-2.5 rounded-2xl border border-danger-soft-border bg-danger-soft p-4 text-small text-danger"
              >
                <AlertCircle className="size-4 shrink-0" />
                <span>{state.error}</span>
              </div>
            ) : null}

            <div className="pt-2">
              <SubmitButton label={copy.submit} isLogin={isLogin} />
            </div>
          </form>

          <div className="mt-6 text-center text-tiny text-muted-foreground">
            {copy.altText}{" "}
            <Link
              href={copy.altHref}
              className="font-bold text-brand-stronger underline-offset-4 hover:underline transition-colors"
            >
              {copy.altLabel}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
