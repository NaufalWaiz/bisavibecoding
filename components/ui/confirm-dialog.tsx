"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Dialog konfirmasi untuk aksi yang menimpa/menghapus data.
 *
 * Menggantikan `window.confirm()`. Selain tampilannya yang menabrak seluruh
 * halaman, dialog bawaan browser memblokir thread dan tidak bisa menampilkan
 * konsekuensi aksi — padahal di sini konsekuensinya nyata (PRD tertimpa,
 * seluruh task diganti).
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Lanjutkan",
  cancelLabel = "Batal",
  tone = "default",
  onConfirm,
}: {
  trigger: React.ReactNode;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  onConfirm: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    setPending(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="gap-2">
          <span
            aria-hidden
            className={
              tone === "danger"
                ? "flex size-10 items-center justify-center rounded-xl border border-danger-soft-border bg-danger-soft text-danger"
                : "flex size-10 items-center justify-center rounded-xl border border-amber-soft-border bg-amber-soft text-amber-text"
            }
          >
            <AlertTriangle className="size-5" />
          </span>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone === "danger" ? "destructive" : "default"}
            onClick={() => void handleConfirm()}
            disabled={pending}
          >
            {pending ? "Memproses…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
