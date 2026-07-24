"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQS = [
  {
    question: "Bagaimana bisavibecoding membantu AI Coding Agent saya?",
    answer:
      "bisavibecoding mengubah ide mentah menjadi PRD terstruktur dan membaginya menjadi task-task mandiri (self-contained). Setiap task otomatis membawa konteks entitas, file relevan, dan acceptance criteria sehingga Claude Code, Cursor, atau Windsurf bekerja tanpa tebak-tebakan.",
  },
  {
    question: "Apa itu penanda 'Stale Task' dan bagaimana cara kerjanya?",
    answer:
      "Saat kamu mengubah dan mengunci ulang PRD (misal dari v1 ke v2), bisavibecoding otomatis membandingkan versi dokumen. Task yang dibuat dari PRD v1 akan ditandai 'Stale' secara otomatis sehingga kamu tahu persis task mana yang perlu di-regenerate tanpa merusak task lain.",
  },
  {
    question: "Apakah saya bisa mengekspor file aturan untuk repository saya?",
    answer:
      "Ya! bisavibecoding menyediakan tab Ekspor Berkas yang menghasilkan file `CLAUDE.md`, `.cursorrules`, dan template `prompt-task.md` yang dapat langsung kamu salin ke root repository project kamu.",
  },
  {
    question: "AI Coding Agent apa saja yang didukung?",
    answer:
      "bisavibecoding dirancang kompatibel dengan semua AI coding agent modern termasuk Claude Code CLI, Cursor IDE, Windsurf, GitHub Copilot Workspace, dan V0.",
  },
];

export function WikoFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3">
      {FAQS.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={faq.question}
            className={`overflow-hidden rounded-2xl border bg-white/90 shadow-warm-xs transition-all duration-300 ${
              isOpen
                ? "border-brand-soft-border shadow-warm-md ring-1 ring-brand-soft/50"
                : "border-border/80 hover:border-border"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 p-5 text-left font-medium text-foreground transition-colors hover:text-brand-stronger"
            >
              <span className="flex items-center gap-3 text-small font-semibold">
                <HelpCircle className="size-4 shrink-0 text-brand-stronger opacity-80" />
                {faq.question}
              </span>
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-muted-foreground transition-transform duration-300 ${
                  isOpen ? "rotate-180 bg-brand-soft text-brand-stronger" : ""
                }`}
              >
                <ChevronDown className="size-4" />
              </span>
            </button>
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen ? "grid-rows-[1fr] opacity-100 pb-5" : "grid-rows-[0fr] opacity-0 pb-0"
              }`}
            >
              <div className="overflow-hidden px-5 text-small leading-relaxed text-muted-foreground">
                <div className="border-t border-border/40 pt-3">{faq.answer}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
