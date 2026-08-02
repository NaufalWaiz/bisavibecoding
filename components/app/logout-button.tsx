"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { triggerNavProgress } from "@/components/ui/navigation-progress";

export function LogoutButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => triggerNavProgress()}
      className="h-8 gap-1.5 rounded-full px-3 text-tiny text-muted-foreground hover:bg-danger-soft hover:text-danger border border-transparent hover:border-danger-soft-border transition-warm cursor-pointer disabled:opacity-75"
    >
      {pending ? (
        <>
          <Loader2 className="size-3.5 animate-spin text-danger" />
          <span className="hidden sm:inline font-semibold text-danger">Mengeluarkan…</span>
        </>
      ) : (
        <>
          <LogOut className="size-3.5" />
          <span className="hidden sm:inline">Keluar</span>
        </>
      )}
    </Button>
  );
}
