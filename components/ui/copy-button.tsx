"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Tombol salin dengan umpan balik "Tersalin" selama 2 detik.
 *
 * Pola ini sebelumnya diulang di enam tempat, masing-masing dengan state dan
 * timeout-nya sendiri — dan tidak satu pun membersihkan timeout-nya saat
 * komponen dilepas (kartu task bisa hilang dari daftar setelah difilter).
 */
export function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Tersalin",
  toastMessage,
  variant = "outline",
  size = "sm",
  className,
  iconOnly = false,
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  toastMessage?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
  iconOnly?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (toastMessage) toast.success(toastMessage);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Browser menolak akses clipboard.");
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={() => void handleCopy()}
      aria-label={iconOnly ? label : undefined}
      className={cn("gap-1.5", className)}
    >
      {copied ? (
        <Check className="size-3.5 text-sage-strong" />
      ) : (
        <Copy className="size-3.5" />
      )}
      {iconOnly ? null : <span>{copied ? copiedLabel : label}</span>}
    </Button>
  );
}
