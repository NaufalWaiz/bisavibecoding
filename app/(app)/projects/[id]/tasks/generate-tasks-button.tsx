"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  CheckSquare,
  Clock,
  Code2,
  Cpu,
  Layers,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Wand2,
} from "lucide-react";

type Props = {
  projectId: string;
  hasTasks: boolean;
  staleCount: number;
  prdLocked: boolean;
  busy?: "all" | "stale" | null;
  onGenerate?: (mode: "all" | "stale") => void;
  /** Hanya tampilkan tombol regenerate stale (dipakai di banner peringatan). */
  staleOnly?: boolean;
};

export function GenerateTasksButton({
  projectId,
  hasTasks,
  staleCount,
  prdLocked,
  busy: controlledBusy,
  onGenerate,
  staleOnly = false,
}: Props) {
  const router = useRouter();
  const [internalBusy, setInternalBusy] = useState<"all" | "stale" | null>(null);
  const busy = controlledBusy !== undefined ? controlledBusy : internalBusy;

  async function generate(mode: "all" | "stale") {
    if (onGenerate) {
      onGenerate(mode);
      return;
    }
    setInternalBusy(mode);
    try {
      const response = await fetch("/api/ai/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, mode, tier: "premium" }),
      });

      const data = (await response.json()) as {
        error?: string;
        count?: number;
        regenerated?: number;
        remainingStale?: number;
      };

      if (!response.ok) throw new Error(data.error ?? "Generasi task gagal.");

      if (mode === "all") {
        toast.success(`${data.count ?? 0} task dihasilkan.`);
      } else if (data.remainingStale && data.remainingStale > 0) {
        toast.warning(
          `${data.regenerated ?? 0} task diperbarui, tapi ${data.remainingStale} masih stale. Coba jalankan sekali lagi.`,
        );
      } else {
        toast.success(
          `${data.regenerated ?? 0} task stale diperbarui — task lain tidak tersentuh.`,
        );
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generasi task gagal.");
    } finally {
      setInternalBusy(null);
    }
  }

  const blockedTitle = prdLocked ? undefined : "Kunci PRD dulu di tab PRD.";

  const staleButton = (
    <Button
      size="sm"
      onClick={() => void generate("stale")}
      disabled={busy !== null || !prdLocked}
      title={blockedTitle}
      className="gap-1.5 cursor-pointer font-semibold shadow-warm-xs"
    >
      {busy === "stale" ? (
        <Loader2 className="size-3.5 animate-spin text-amber-text" />
      ) : (
        <RefreshCw className="size-3.5" />
      )}
      {busy === "stale" ? "Memperbarui…" : `Regenerate ${staleCount} stale`}
    </Button>
  );

  if (staleOnly) return staleButton;

  const regenerateAll = (
    <ConfirmDialog
      tone="danger"
      title="Generate ulang semua task?"
      description="Seluruh task yang ada — termasuk status pengerjaan dan catatan yang menempel padanya — diganti hasil generasi baru. Kalau yang ketinggalan versi hanya sebagian, pakai “Regenerate stale” saja."
      confirmLabel="Ya, ganti semua task"
      onConfirm={() => void generate("all")}
      trigger={
        <Button
          size="sm"
          /* Selalu sekunder: mengganti seluruh task itu merusak, jangan jadi
             tombol paling menggoda di halaman. */
          variant="outline"
          disabled={busy !== null || !prdLocked}
          title={blockedTitle}
          className="gap-1.5 cursor-pointer font-medium"
        >
          {busy === "all" ? (
            <Loader2 className="size-3.5 animate-spin text-brand" />
          ) : (
            <Wand2 className="size-3.5" />
          )}
          {busy === "all" ? "Menyusun task…" : "Generate ulang semua"}
        </Button>
      }
    />
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {staleCount > 0 ? staleButton : null}

      {hasTasks ? (
        regenerateAll
      ) : (
        <Button
          size="sm"
          onClick={() => void generate("all")}
          disabled={busy !== null || !prdLocked}
          title={blockedTitle}
          className="gap-1.5 font-semibold shadow-warm-brand cursor-pointer"
        >
          {busy === "all" ? (
            <Sparkles className="size-3.5 animate-spin text-[#BEF264]" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          {busy === "all" ? "Menyusun task…" : "Generate task"}
        </Button>
      )}
    </div>
  );
}

export function TaskGenerationShowcase({ mode }: { mode: "all" | "stale" }) {
  const [elapsed, setElapsed] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  const TASK_THINKING_STEPS = [
    { label: "Membaca PRD terkunci & spesifikasi arsitektur", icon: Search },
    { label: "Memecah dokumen menjadi task-task mandiri 1 sesi fokus", icon: Layers },
    { label: "Menempelkan context slice, entitas Drizzle, & API contracts", icon: Code2 },
    { label: "Memformulasikan kriteria penerimaan yang teruji", icon: CheckSquare },
    { label: "Finalisasi standalone prompt untuk Claude Code & Cursor", icon: Sparkles },
  ];

  useEffect(() => {
    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setElapsed((Date.now() - startTime) / 1000);
    }, 100);

    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % TASK_THINKING_STEPS.length);
    }, 1300);

    return () => {
      clearInterval(timerInterval);
      clearInterval(stepInterval);
    };
  }, []);

  const CurrentIcon = TASK_THINKING_STEPS[stepIndex].icon;
  const currentLabel = TASK_THINKING_STEPS[stepIndex].label;

  return (
    <div className="w-full my-4 flex flex-col gap-4 animate-fade-up">
      {/* Live AI Status & Real-time Temporary Timer Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-soft-border bg-[#0F172A] px-5 py-3.5 text-white shadow-warm-md">
        <div className="flex items-center gap-3">
          <span className="relative flex size-8 items-center justify-center rounded-xl bg-brand-soft/20 border border-brand-soft-border/40">
            <Cpu className="size-4 text-brand animate-spin" style={{ animationDuration: "3s" }} />
            <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-brand animate-ping" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-small font-bold text-white">
                {mode === "stale" ? "Regenerasi Task Stale AI" : "Sintesis Task Prompts AI"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-soft-border/50 bg-brand-soft/20 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-brand">
                <span className="size-1.5 rounded-full bg-brand animate-pulse" />
                Synthesizing
              </span>
            </div>
            <p className="text-tiny text-slate-300">
              {mode === "stale"
                ? "Memperbarui task yang terdampak versi PRD terbaru."
                : "Mengubah PRD terkunci menjadi task standalone berkonteks penuh."}
            </p>
          </div>
        </div>

        {/* Temporary Realtime Elapsed Timer Badge */}
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/90 px-3 py-1 font-mono text-tiny font-bold text-slate-200 shadow-warm-xs">
            <Clock className="size-3.5 text-brand" />
            <span>{elapsed.toFixed(1)}s</span>
          </span>
        </div>
      </div>

      {/* Main Interactive Showcase Area */}
      <div className="w-full rounded-2xl border border-brand-soft-border bg-surface p-5 shadow-warm-md sm:p-6">
        <div className="flex flex-col gap-4">
          {/* Dynamic Thinking Step Ticker */}
          <div className="flex items-center justify-between rounded-xl border border-brand-soft-border/80 bg-brand-soft/60 px-4 py-3 shadow-warm-xs">
            <AnimatePresence mode="wait">
              <motion.div
                key={stepIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-2.5 text-small font-bold text-brand-stronger"
              >
                <CurrentIcon className="size-4 text-brand-strong shrink-0" />
                <span>{currentLabel}…</span>
              </motion.div>
            </AnimatePresence>

            {/* Bouncing Radar Waveform */}
            <div className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-brand-strong animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="size-2 rounded-full bg-brand-strong animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="size-2 rounded-full bg-brand-strong animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>

          {/* Shimmer Scanline Preview Wireframe */}
          <div className="relative overflow-hidden rounded-xl border border-border/80 bg-surface-sunken/40 p-5 space-y-3">
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-brand/20 to-transparent animate-shimmer"
              style={{ backgroundSize: "200% 100%" }}
            />
            <div className="flex items-center gap-3">
              <span className="h-3.5 w-1/3 rounded-md bg-brand-soft border border-brand-soft-border animate-pulse" />
              <span className="h-3 w-1/4 rounded-md bg-surface-sunken animate-pulse" />
            </div>
            <span className="block h-3 w-5/6 rounded-md bg-surface-sunken animate-pulse" />
            <span className="block h-3 w-2/3 rounded-md bg-surface-sunken animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
