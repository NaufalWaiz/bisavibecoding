"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  DATABASE_OPTIONS,
  FRAMEWORK_OPTIONS,
  LANGUAGE_OPTIONS,
  STYLING_OPTIONS,
  STACK_PRESETS,
  findMatchingPreset,
  type StackPreset,
} from "@/lib/stack";
import {
  createProjectAction,
  type ProjectFormState,
} from "./actions";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Code2,
  Database,
  FileText,
  FolderPlus,
  Layers,
  Palette,
  Plus,
  RotateCcw,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <motion.div whileHover={{ scale: pending ? 1 : 1.02 }} whileTap={{ scale: pending ? 1 : 0.97 }}>
      <Button
        type="submit"
        disabled={pending}
        className="h-10 px-5 gap-2 font-semibold shadow-warm-brand transition-all cursor-pointer"
      >
        {pending ? (
          <>
            <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            <span>Menyimpan…</span>
          </>
        ) : (
          <>
            <Sparkles className="size-4 text-primary-foreground" />
            <span>Buat project</span>
          </>
        )}
      </Button>
    </motion.div>
  );
}

/**
 * Select kustom interaktif berbasis Radix UI dengan gaya design system bisavibecoding.
 * Dilengkapi ikon konteks, animasi smooth, dan input tersembunyi untuk FormData.
 */
function StackSelect({
  id,
  label,
  icon: Icon,
  options,
  value,
  onChange,
  required = true,
  placeholder,
}: {
  id: string;
  label: string;
  icon?: React.ElementType;
  options: readonly string[];
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="flex items-center gap-1.5 text-tiny font-medium text-foreground">
        {Icon ? <Icon className="size-3.5 text-brand-strong" /> : null}
        <span>{label}</span>
        {required ? (
          <span className="text-danger">*</span>
        ) : (
          <span className="text-[10px] text-muted-foreground">(opsional)</span>
        )}
      </Label>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="h-10 w-full bg-surface/90 hover:border-brand-soft-border focus:border-brand-strong">
          <SelectValue placeholder={placeholder ?? "Pilih opsi…"} />
        </SelectTrigger>
        <SelectContent>
          {!required ? (
            <SelectItem value="none" className="text-muted-foreground font-normal">
              {placeholder ?? "— Belum ditentukan —"}
            </SelectItem>
          ) : null}
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Hidden input agar pengiriman FormData via Server Action tetap berfungsi sempurna */}
      <input type="hidden" name={id} value={value === "none" ? "" : value} />
    </div>
  );
}

function shortFramework(fw: string) {
  if (fw.includes("Next.js")) return "Next.js";
  if (fw.includes("Vite")) return "React + Vite";
  if (fw.includes("Express")) return "Express API";
  if (fw.includes("FastAPI")) return "FastAPI";
  if (fw.includes("Laravel")) return "Laravel";
  if (fw.includes("Expo")) return "Expo Mobile";
  return fw;
}

function shortDatabase(db: string) {
  if (db.includes("Supabase")) return "Supabase";
  if (db.includes("Neon")) return "Neon Postgres";
  if (db.includes("MySQL")) return "MySQL";
  if (db.includes("Firestore")) return "Firestore";
  if (db.includes("SQLite")) return "SQLite";
  return db;
}

function shortStyling(st?: string) {
  if (!st || st === "Tanpa framework CSS") return "Plain CSS";
  if (st.includes("shadcn")) return "shadcn/ui";
  if (st.includes("Tailwind")) return "Tailwind CSS";
  return st;
}

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

  // Menyimpan preset dasar yang terakhir dipilih pengguna
  const [lastSelectedPreset, setLastSelectedPreset] = useState<StackPreset | null>(STACK_PRESETS[0]);

  // Cek apakah stack saat ini persis cocok dengan salah satu preset
  const matchedPreset = findMatchingPreset(framework, language, database, styling);
  const isPresetExactMatch = Boolean(matchedPreset);
  const activePreset = matchedPreset || lastSelectedPreset;
  const isCustomized = !isPresetExactMatch && Boolean(lastSelectedPreset);

  // Kalau server action berhasil ia me-redirect. Error tetap ditampilkan di dalam dialog.
  useEffect(() => {
    if (state.error) setOpen(true);
  }, [state.error]);

  function applyPreset(preset: StackPreset) {
    setFramework(preset.framework);
    setLanguage(preset.language);
    setDatabase(preset.database);
    setStyling(preset.styling);
    setLastSelectedPreset(preset);
  }

  function resetToPreset() {
    if (activePreset) {
      applyPreset(activePreset);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <Button className="gap-2 font-semibold shadow-warm-brand cursor-pointer">
              <Plus className="size-4" />
              {label}
            </Button>
          </motion.div>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl md:max-w-2xl p-0 overflow-hidden flex flex-col max-h-[88vh] border-border/80 bg-surface shadow-warm-lg rounded-2xl">
        {/* Header Modal Fixed */}
        <div className="relative shrink-0 border-b border-border/70 bg-gradient-to-r from-surface via-surface-sunken/40 to-surface px-6 py-5">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-brand/20 blur-3xl"
          />

          <div className="relative flex flex-col gap-1.5">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-brand-soft-border bg-brand-soft px-2.5 py-0.5 text-[11px] font-semibold text-brand-stronger shadow-warm-xs">
              <FolderPlus className="size-3.5 text-brand-strong" />
              Arsitektur Project Baru
            </span>

            <DialogTitle className="font-heading text-h2 tracking-tight text-foreground">
              Project baru
            </DialogTitle>
            <DialogDescription className="text-small text-muted-foreground leading-relaxed max-w-lg">
              Tentukan nama dan stack teknologi. bisavibecoding akan menyesuaikan PRD dan pembagian task secara otomatis.
            </DialogDescription>
          </div>
        </div>

        {/* Form Body Scrollable with GPU Acceleration */}
        <form action={formAction} className="flex flex-1 flex-col overflow-hidden">
          <div
            className="flex-1 overflow-y-auto pane-scroll overscroll-contain p-6 space-y-5 bg-surface-sunken/30"
            style={{ transform: "translateZ(0)", willChange: "scroll-position" }}
          >
            {/* Section 1: Identitas Project */}
            <div className="rounded-xl border border-border/80 bg-surface p-4.5 space-y-4 shadow-warm-xs hover:border-border-strong transition-colors">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <div className="flex size-6 items-center justify-center rounded-md bg-brand-soft text-brand-strong">
                  <FileText className="size-3.5" />
                </div>
                <h4 className="font-heading text-small font-semibold text-foreground">
                  Identitas Project
                </h4>
              </div>

              <div className="grid gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name" className="text-tiny font-medium text-foreground">
                    Nama project <span className="text-danger">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    minLength={2}
                    placeholder="mis. Toko Kue Rumahan / SaaS Analytics"
                    className="h-10 text-small bg-surface/90 hover:border-brand-soft-border focus:border-brand-strong transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="description" className="text-tiny font-medium text-foreground">
                    Deskripsi singkat <span className="text-[10px] text-muted-foreground">(opsional)</span>
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={2}
                    placeholder="Satu atau dua kalimat gambaran utama produk yang ingin kamu bangun..."
                    className="text-small resize-none bg-surface/90 hover:border-brand-soft-border focus:border-brand-strong transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Stack & Arsitektur */}
            <div className="rounded-xl border border-border/80 bg-surface p-4.5 space-y-4 shadow-warm-xs hover:border-border-strong transition-colors">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-6 items-center justify-center rounded-md bg-brand-soft text-brand-strong">
                    <Layers className="size-3.5" />
                  </div>
                  <div>
                    <h4 className="font-heading text-small font-semibold text-foreground">
                      Stack & Arsitektur
                    </h4>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground">
                  PRD & Task Engine
                </span>
              </div>

              {/* Status Header: Active Preset / Customized State */}
              <div className="rounded-xl border border-border/70 bg-surface-sunken/50 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-warm-xs">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface border border-border/80 text-brand-strong shadow-warm-xs">
                    {matchedPreset ? <Sparkles className="size-4 text-brand-strong" /> : <SlidersHorizontal className="size-4 text-amber-text" />}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-tiny font-semibold text-foreground">
                        {matchedPreset
                          ? `Stack Preset: ${matchedPreset.name}`
                          : isCustomized
                          ? `Stack Kustom (Disesuaikan dari ${activePreset?.name})`
                          : "Stack Kustom Arsitektur"}
                      </span>
                      {matchedPreset && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand-stronger border border-brand-soft-border">
                          <Check className="size-2.5 text-brand-strong" /> Preset Verified
                        </span>
                      )}
                      {isCustomized && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-soft px-2 py-0.5 text-[10px] font-semibold text-amber-text border border-amber-soft-border">
                          Customized
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {matchedPreset
                        ? matchedPreset.tagline
                        : "Stack telah disesuaikan. Kamu dapat mengembalikan ke preset awal atau mengubah opsi detail di bawah."}
                    </p>
                  </div>
                </div>

                {isCustomized && activePreset && (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={resetToPreset}
                      className="h-8 px-3 text-tiny font-semibold gap-1.5 text-foreground hover:text-brand-stronger border-border/80 hover:border-brand-soft-border bg-surface cursor-pointer shadow-warm-xs"
                    >
                      <RotateCcw className="size-3.5 text-brand-strong" />
                      Kembalikan ke Preset
                    </Button>
                  </motion.div>
                )}
              </div>

              {/* Stack Presets Grid */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-tiny font-medium text-foreground flex items-center gap-1.5">
                    <Zap className="size-3.5 text-brand-strong" />
                    Pilihan Preset Rekomendasi
                  </Label>
                  <span className="text-[10px] text-muted-foreground">Pilih preset untuk mengisi otomatis</span>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2 max-h-[320px] overflow-y-auto pane-scroll pr-1">
                  {STACK_PRESETS.map((preset) => {
                    const isSelectedExact =
                      framework === preset.framework &&
                      language === preset.language &&
                      database === preset.database &&
                      (styling === preset.styling || (preset.styling === "Tanpa framework CSS" && (!styling || styling === "none" || styling === "Tanpa framework CSS")));

                    return (
                      <motion.button
                        key={preset.id}
                        type="button"
                        whileHover={{ scale: 1.01, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => applyPreset(preset)}
                        className={cn(
                          "relative text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 h-full min-h-[148px]",
                          isSelectedExact
                            ? "border-brand-strong bg-brand-soft/30 shadow-warm-xs ring-1 ring-brand-strong/30"
                            : "border-border/80 bg-surface hover:border-border-strong hover:bg-surface-sunken/40"
                        )}
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between gap-2 min-h-[22px]">
                            <span className="text-tiny font-semibold text-foreground truncate">
                              {preset.name}
                            </span>
                            {preset.badge ? (
                              <span
                                className={cn(
                                  "shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                                  preset.popular
                                    ? "bg-brand-soft border-brand-soft-border text-brand-stronger"
                                    : "bg-surface-sunken border-border/70 text-muted-foreground"
                                )}
                              >
                                {preset.badge}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed min-h-[2.1rem] flex items-center">
                            {preset.tagline}
                          </p>
                        </div>

                        {/* 2x2 Tech Chips Grid for Perfectly Balanced Height */}
                        <div className="pt-2 border-t border-border/50 grid grid-cols-2 gap-1 text-[10px] font-mono shrink-0">
                          <span className="inline-flex items-center gap-1 text-foreground/90 bg-surface-sunken/80 px-1.5 py-0.5 rounded border border-border/60 overflow-hidden">
                            <Layers className="size-2.5 text-brand-strong shrink-0" />
                            <span className="truncate">{shortFramework(preset.framework)}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 text-foreground/90 bg-surface-sunken/80 px-1.5 py-0.5 rounded border border-border/60 overflow-hidden">
                            <Code2 className="size-2.5 text-brand-strong shrink-0" />
                            <span className="truncate">{preset.language}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 text-foreground/90 bg-surface-sunken/80 px-1.5 py-0.5 rounded border border-border/60 overflow-hidden">
                            <Database className="size-2.5 text-brand-strong shrink-0" />
                            <span className="truncate">{shortDatabase(preset.database)}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 text-foreground/90 bg-surface-sunken/80 px-1.5 py-0.5 rounded border border-border/60 overflow-hidden">
                            <Palette className="size-2.5 text-brand-strong shrink-0" />
                            <span className="truncate">{shortStyling(preset.styling)}</span>
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Direct Edit Dropdowns Section */}
              <div className="pt-3 border-t border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-tiny font-semibold text-foreground">
                    <SlidersHorizontal className="size-3.5 text-brand-strong" />
                    Penyesuaian Detail Stack
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Ubah opsi dropdown untuk membuat kombinasi kustom
                  </span>
                </div>

                {/* 2x2 Stack Select Grid */}
                <div className="grid gap-4 sm:grid-cols-2 bg-surface-sunken/40 p-3.5 rounded-xl border border-border/60">
                  <StackSelect
                    id="framework"
                    label="Framework"
                    icon={Layers}
                    options={FRAMEWORK_OPTIONS}
                    value={framework}
                    onChange={setFramework}
                  />
                  <StackSelect
                    id="language"
                    label="Bahasa"
                    icon={Code2}
                    options={LANGUAGE_OPTIONS}
                    value={language}
                    onChange={setLanguage}
                  />
                  <StackSelect
                    id="database"
                    label="Database"
                    icon={Database}
                    options={DATABASE_OPTIONS}
                    value={database}
                    onChange={setDatabase}
                  />
                  <StackSelect
                    id="styling"
                    label="Styling"
                    icon={Palette}
                    options={STYLING_OPTIONS}
                    value={styling}
                    onChange={setStyling}
                    required={false}
                    placeholder="Belum ditentukan"
                  />
                </div>
              </div>
            </div>


            {/* Section 3: Catatan Stack */}
            <div className="rounded-xl border border-border/80 bg-surface p-4.5 space-y-3 shadow-warm-xs hover:border-border-strong transition-colors">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="notes" className="text-tiny font-medium text-foreground flex items-center justify-between">
                  <span>Catatan tambahan arsitektur</span>
                  <span className="text-[10px] text-muted-foreground">(opsional)</span>
                </Label>
                <Input
                  id="notes"
                  name="notes"
                  placeholder="mis. deploy ke Vercel, auth pakai Supabase, Tailwind v4"
                  className="h-10 text-small bg-surface/90 hover:border-brand-soft-border focus:border-brand-strong transition-all"
                />
              </div>
            </div>

            {/* Error Message dengan AnimatePresence */}
            <AnimatePresence>
              {state.error ? (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  transition={{ duration: 0.2 }}
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-danger-soft-border bg-danger-soft p-3.5 text-small text-danger"
                >
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <p>{state.error}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Footer Modal Fixed */}
          <DialogFooter className="shrink-0 flex items-center justify-end gap-3 border-t border-border/80 bg-surface-sunken/80 px-6 py-4 rounded-b-2xl m-0">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="h-10 px-4 text-small cursor-pointer"
              >
                Batal
              </Button>
            </motion.div>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
