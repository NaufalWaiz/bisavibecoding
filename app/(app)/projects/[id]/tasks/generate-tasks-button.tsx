"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Loader2, RefreshCw, Sparkles, Wand2 } from "lucide-react";

type Props = {
  projectId: string;
  hasTasks: boolean;
  staleCount: number;
  prdLocked: boolean;
  /** Hanya tampilkan tombol regenerate stale (dipakai di banner peringatan). */
  staleOnly?: boolean;
};

export function GenerateTasksButton({
  projectId,
  hasTasks,
  staleCount,
  prdLocked,
  staleOnly = false,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<"all" | "stale" | null>(null);

  async function generate(mode: "all" | "stale") {
    setBusy(mode);
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
        // Jangan bilang "berhasil" kalau masih ada yang tertinggal.
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
      setBusy(null);
    }
  }

  const blockedTitle = prdLocked ? undefined : "Kunci PRD dulu di tab PRD.";

  const staleButton = (
    <Button
      size="sm"
      onClick={() => void generate("stale")}
      disabled={busy !== null || !prdLocked}
      title={blockedTitle}
      className="gap-1.5"
    >
      {busy === "stale" ? (
        <Loader2 className="size-3.5 animate-spin" />
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
      onConfirm={() => generate("all")}
      trigger={
        <Button
          size="sm"
          /* Selalu sekunder: mengganti seluruh task itu merusak, jangan jadi
             tombol paling menggoda di halaman. */
          variant="outline"
          disabled={busy !== null || !prdLocked}
          title={blockedTitle}
          className="gap-1.5"
        >
          {busy === "all" ? (
            <Loader2 className="size-3.5 animate-spin" />
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
          className="gap-1.5"
        >
          {busy === "all" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          {busy === "all" ? "Menyusun task…" : "Generate task"}
        </Button>
      )}
    </div>
  );
}
