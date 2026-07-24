"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, MessageSquarePlus, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { submitTaskFeedbackAction } from "./actions";

/**
 * Satu pertanyaan saja: prompt ini bikin AI-mu sekali jalan benar, atau perlu
 * revisi? Jawabannya adalah metrik utama produk (PRD §4).
 *
 * Kolom catatan disembunyikan di balik satu klik — memintanya di muka membuat
 * penilaian terasa seperti formulir, dan formulir jarang diisi.
 */
export function TaskFeedbackForm({
  projectId,
  taskId,
  currentOutcome,
}: {
  projectId: string;
  taskId: string;
  currentOutcome: "success" | "failed" | null;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submit(outcome: "success" | "failed") {
    startTransition(async () => {
      const result = await submitTaskFeedbackAction(
        projectId,
        taskId,
        outcome,
        notes,
      );
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setNotes("");
      setShowNotes(false);
      toast.success("Terima kasih — penilaianmu dicatat.");
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-warm-xs">
      <p className="text-small font-semibold text-foreground">
        Prompt ini bikin AI-mu sekali jalan benar?
      </p>
      <p className="mt-1 text-tiny leading-relaxed text-muted-foreground">
        {currentOutcome ? (
          <>
            Penilaian terakhir:{" "}
            <span
              className={cn(
                "font-semibold",
                currentOutcome === "success" ? "text-sage-text" : "text-danger",
              )}
            >
              {currentOutcome === "success" ? "sekali jalan" : "perlu revisi"}
            </span>
            . Kirim lagi kalau berubah — riwayatnya disimpan.
          </>
        ) : (
          "Jawab setelah kamu benar-benar memakai prompt-nya. Ini metrik utama produk ini."
        )}
      </p>

      {showNotes ? (
        <Textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={2}
          autoFocus
          placeholder="Apa yang meleset? (opsional)"
          className="mt-3 text-tiny"
          disabled={isPending}
        />
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={() => submit("success")}
          disabled={isPending}
          className="gap-1.5"
        >
          {currentOutcome === "success" ? (
            <Check className="size-3.5" />
          ) : (
            <ThumbsUp className="size-3.5" />
          )}
          Sekali jalan
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => submit("failed")}
          disabled={isPending}
          className="gap-1.5"
        >
          <ThumbsDown className="size-3.5" />
          Perlu revisi
        </Button>

        {!showNotes ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowNotes(true)}
            disabled={isPending}
            className="gap-1.5 text-muted-foreground"
          >
            <MessageSquarePlus className="size-3.5" />
            Tambah catatan
          </Button>
        ) : null}
      </div>
    </div>
  );
}
