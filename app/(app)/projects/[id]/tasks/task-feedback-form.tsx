"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, MessageSquarePlus, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { submitTaskFeedbackAction } from "./actions";

export type FeedbackOutcomeValue = "success" | "failed";

/**
 * Satu pertanyaan saja: prompt ini bikin AI-mu sekali jalan benar, atau perlu
 * revisi? Jawabannya adalah metrik utama produk (PRD §4).
 *
 * Karena ini sumber metrik utama, aksinya harus semurah mungkin: satu klik,
 * tanpa membuka apa pun. Catatan bersifat opsional dan disembunyikan di balik
 * satu klik lagi — memintanya di muka membuat penilaian terasa seperti
 * formulir, dan formulir jarang diisi.
 */
function useSubmitFeedback(projectId: string, taskId: string) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function submit(outcome: FeedbackOutcomeValue, notes = "", onDone?: () => void) {
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
      onDone?.();
      toast.success(
        outcome === "success"
          ? "Dicatat: sekali jalan benar."
          : "Dicatat: perlu revisi.",
      );
      router.refresh();
    });
  }

  return { submit, isPending };
}

/* -------------------------------------------------------------------------- */

/**
 * Aksi satu klik yang menempel di ringkasan task — tidak perlu membuka detail.
 *
 * Sebelumnya penilaian hanya ada di dalam panel detail, jadi mencatat satu
 * hasil butuh buka detail → gulir → klik. Untuk angka yang jadi metrik utama
 * produk, tiga langkah itu terlalu mahal dan datanya jadi jarang terkumpul.
 */
export function TaskFeedbackQuickActions({
  projectId,
  taskId,
  currentOutcome,
}: {
  projectId: string;
  taskId: string;
  currentOutcome: FeedbackOutcomeValue | null;
}) {
  const { submit, isPending } = useSubmitFeedback(projectId, taskId);

  return (
    <div
      className="flex items-center gap-1"
      role="group"
      aria-label="Hasil pemakaian prompt"
    >
      <QuickButton
        active={currentOutcome === "success"}
        disabled={isPending}
        onClick={() => submit("success")}
        label="Sekali jalan"
        title="Prompt ini bikin AI-ku sekali jalan benar"
        activeClass="border-sage-soft-border bg-sage-soft text-sage-text"
        icon={
          currentOutcome === "success" ? (
            <Check className="size-3.5" />
          ) : (
            <ThumbsUp className="size-3.5" />
          )
        }
      />
      <QuickButton
        active={currentOutcome === "failed"}
        disabled={isPending}
        onClick={() => submit("failed")}
        label="Perlu revisi"
        title="Prompt ini masih perlu revisi"
        activeClass="border-danger-soft-border bg-danger-soft text-danger"
        icon={<ThumbsDown className="size-3.5" />}
      />
    </div>
  );
}

function QuickButton({
  active,
  disabled,
  onClick,
  label,
  title,
  icon,
  activeClass,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  label: string;
  title: string;
  icon: React.ReactNode;
  activeClass: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-tiny font-semibold transition-warm disabled:opacity-50",
        active
          ? activeClass
          : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground",
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */

/** Versi lengkap di panel detail — sama aksinya, plus kolom catatan opsional. */
export function TaskFeedbackForm({
  projectId,
  taskId,
  currentOutcome,
}: {
  projectId: string;
  taskId: string;
  currentOutcome: FeedbackOutcomeValue | null;
}) {
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const { submit, isPending } = useSubmitFeedback(projectId, taskId);

  function send(outcome: FeedbackOutcomeValue) {
    submit(outcome, notes, () => {
      setNotes("");
      setShowNotes(false);
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
          onClick={() => send("success")}
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
          onClick={() => send("failed")}
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
