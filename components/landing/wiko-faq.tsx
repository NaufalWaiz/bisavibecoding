"use client";

import { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";

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
      "Ya! bisavibecoding menyediakan tab Ekspor Berkas yang menghasilkan file CLAUDE.md, .cursorrules, dan template prompt-task.md yang dapat langsung kamu salin ke root repository project kamu.",
  },
  {
    question: "AI Coding Agent apa saja yang didukung?",
    answer:
      "bisavibecoding dirancang kompatibel dengan semua AI coding agent modern termasuk Claude Code CLI, Cursor IDE, Windsurf, GitHub Copilot Workspace, dan V0.",
  },
  {
    question: "Apakah aman menyimpan data spesifikasi produk di sini?",
    answer:
      "Sangat aman. Semua data tersimpan di infrastruktur terenkripsi dengan otentikasi tingkat lanjut dan Row Level Security (RLS) di Supabase. Kami tidak pernah menggunakan kode atau PRD milikmu untuk melatih AI.",
  },
  {
    question: "Bagaimana cara beralih antar paket berlangganan?",
    answer:
      "Kamu dapat melakukan upgrade atau downgrade paket kapan saja melalui dashboard akun. Perubahan kuota PRD akan langsung aktif seketika.",
  },
];

export function WikoFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Premium single-column accordion with clean dividers */}
      <div className="rounded-[2rem] border border-slate-200/80 bg-white shadow-lg overflow-hidden">
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          const isLast = index === FAQS.length - 1;
          return (
            <div
              key={faq.question}
              className={!isLast ? "border-b border-slate-100" : ""}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="group flex w-full items-center justify-between gap-6 px-7 sm:px-9 py-6 text-left transition-colors hover:bg-slate-50/60"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Numbered Index Badge */}
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-extrabold transition-all duration-300 ${
                      isOpen
                        ? "bg-[#BEF264] text-[#0F172A] shadow-sm scale-110"
                        : "bg-slate-100 text-slate-400 group-hover:bg-[#BEF264]/20 group-hover:text-[#3F6212]"
                    }`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span
                    className={`text-[15px] font-bold leading-snug transition-colors duration-200 ${
                      isOpen ? "text-[#0F172A]" : "text-slate-700 group-hover:text-[#0F172A]"
                    }`}
                  >
                    {faq.question}
                  </span>
                </div>

                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                    isOpen
                      ? "rotate-180 bg-[#0F172A] text-white"
                      : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                  }`}
                >
                  <ChevronDown className="size-3.5" />
                </span>
              </button>

              {/* Collapsible Answer Panel */}
              <div
                className={`grid transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-7 sm:px-9 pb-7 pl-[4.5rem] sm:pl-[5.25rem]">
                    <p className="text-sm leading-[1.75] text-slate-500 font-medium">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtle Bottom Prompt */}
      <div className="mt-8 flex items-center justify-center gap-3 text-xs text-slate-400">
        <Sparkles className="size-3.5 text-[#BEF264]" />
        <span>
          Masih ada pertanyaan?{" "}
          <a href="mailto:support@bisavibecoding.com" className="font-bold text-[#059669] hover:underline">
            Hubungi tim kami
          </a>
        </span>
      </div>
    </div>
  );
}
