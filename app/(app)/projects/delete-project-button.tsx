"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
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
import { deleteProjectAction } from "./actions";
import { Trash2 } from "lucide-react";

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? "Menghapus…" : "Hapus"}
    </Button>
  );
}

export function DeleteProjectButton({
  projectId,
  projectName,
  variant = "ghost",
  iconOnly = false,
}: {
  projectId: string;
  projectName: string;
  variant?: "ghost" | "outline";
  /** Di kartu daftar, label teks bersaing dengan judul project — pakai ikon. */
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {iconOnly ? (
          <Button
            variant={variant}
            size="icon-xs"
            aria-label={`Hapus project ${projectName}`}
            title="Hapus project"
            className="text-muted-foreground hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 className="size-3.5" />
          </Button>
        ) : (
          <Button variant={variant} size="sm" className="gap-1.5">
            <Trash2 className="size-3.5" />
            Hapus
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="gap-2">
          <DialogTitle>Hapus “{projectName}”?</DialogTitle>
          <DialogDescription>
            PRD, task, dan feedback di project ini ikut terhapus permanen.
          </DialogDescription>
        </DialogHeader>
        <form action={deleteProjectAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <ConfirmButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
