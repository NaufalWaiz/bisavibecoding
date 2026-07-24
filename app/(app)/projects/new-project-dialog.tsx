"use client";

import { useActionState, useEffect, useState } from "react";
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
import { Input, fieldClasses } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  DATABASE_OPTIONS,
  FRAMEWORK_OPTIONS,
  LANGUAGE_OPTIONS,
  STYLING_OPTIONS,
} from "@/lib/stack";
import {
  createProjectAction,
  type ProjectFormState,
} from "./actions";
import { Plus, Zap } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Menyimpan…" : "Buat project"}
    </Button>
  );
}

/**
 * Select native dipakai (bukan komponen shadcn `Select`) karena nilainya harus
 * ikut terkirim lewat FormData ke Server Action tanpa state tambahan.
 * Bentuk & fokusnya memakai token yang sama dengan Input.
 */
function StackSelect({
  id,
  label,
  options,
  value,
  onChange,
  required = true,
  placeholder,
}: {
  id: string;
  label: string;
  options: readonly string[];
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        name={id}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(fieldClasses, "h-10 appearance-none px-3.5 text-small")}
      >
        {!required ? <option value="">{placeholder ?? "—"}</option> : null}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

const STACK_PRESETS = [
  {
    name: "Next.js App",
    framework: "Next.js (App Router)",
    language: "TypeScript",
    database: "Postgres (Supabase)",
    styling: "Tailwind CSS + shadcn/ui",
  },
  {
    name: "Vite React",
    framework: "React + Vite",
    language: "TypeScript",
    database: "Postgres (Supabase)",
    styling: "Tailwind CSS",
  },
  {
    name: "Express API",
    framework: "Express",
    language: "TypeScript",
    database: "Postgres (Neon)",
    styling: "",
  },
] as const;

export function NewProjectDialog({
  trigger,
  label = "Project baru",
}: {
  /** Pemicu kustom — dipakai kartu bertitik-titik di daftar project. */
  trigger?: React.ReactNode;
  label?: string;
} = {}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<ProjectFormState, FormData>(
    createProjectAction,
    { error: null },
  );

  const [framework, setFramework] = useState<string>(FRAMEWORK_OPTIONS[0]);
  const [language, setLanguage] = useState<string>(LANGUAGE_OPTIONS[0]);
  const [database, setDatabase] = useState<string>(DATABASE_OPTIONS[0]);
  const [styling, setStyling] = useState<string>(STYLING_OPTIONS[0]);

  // Kalau server action berhasil ia me-redirect, jadi dialog cukup ditutup
  // manual saat user membatalkan. Error tetap ditampilkan di dalam dialog.
  useEffect(() => {
    if (state.error) setOpen(true);
  }, [state.error]);

  function applyPreset(preset: (typeof STACK_PRESETS)[number]) {
    setFramework(preset.framework);
    setLanguage(preset.language);
    setDatabase(preset.database);
    setStyling(preset.styling);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2">
            <Plus className="size-4" />
            {label}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="gap-2">
          <DialogTitle>Project baru</DialogTitle>
          <DialogDescription>
            Nama dan stack dipakai bisavibecoding untuk menyesuaikan PRD dan task yang
            dihasilkan.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nama project</Label>
            <Input
              id="name"
              name="name"
              required
              minLength={2}
              placeholder="mis. Toko Kue Rumahan"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Deskripsi singkat</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              placeholder="Satu kalimat tentang produk ini (opsional)."
            />
          </div>

          {/* Quick Presets */}
          <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-surface-sunken/60 p-3">
            <span className="flex items-center gap-1.5 text-tiny font-semibold text-muted-foreground">
              <Zap className="size-3.5 text-amber" />
              Preset stack cepat
            </span>
            <div className="flex flex-wrap gap-1.5">
              {STACK_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="rounded-lg border border-border/80 bg-card px-2.5 py-1 text-tiny font-medium text-foreground transition-warm hover:border-brand-soft-border hover:bg-brand-soft hover:text-brand-stronger"
                >
                  + {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-x-5">
            <StackSelect
              id="framework"
              label="Framework"
              options={FRAMEWORK_OPTIONS}
              value={framework}
              onChange={setFramework}
            />
            <StackSelect
              id="language"
              label="Bahasa"
              options={LANGUAGE_OPTIONS}
              value={language}
              onChange={setLanguage}
            />
            <StackSelect
              id="database"
              label="Database"
              options={DATABASE_OPTIONS}
              value={database}
              onChange={setDatabase}
            />
            <StackSelect
              id="styling"
              label="Styling"
              options={STYLING_OPTIONS}
              value={styling}
              onChange={setStyling}
              required={false}
              placeholder="Belum ditentukan"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Catatan stack</Label>
            <Input
              id="notes"
              name="notes"
              placeholder="mis. deploy ke Vercel, auth pakai Supabase (opsional)"
            />
          </div>

          {state.error ? (
            <p
              role="alert"
              className="rounded-lg border border-danger-soft-border bg-danger-soft px-4 py-3 text-small text-danger"
            >
              {state.error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
