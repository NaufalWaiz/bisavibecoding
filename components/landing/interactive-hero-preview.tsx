"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STAGES = [
  {
    id: "idea",
    tabLabel: "1. Ide Mentah",
    badge: "Input User",
    title: "Percakapan Awal",
    content: (
      <div className="flex flex-col gap-3 font-sans text-small">
        <div className="ml-auto max-w-[90%] rounded-2xl rounded-tr-xs border border-brand-soft-border bg-brand-soft p-4 text-foreground">
          &quot;Saya mau buat SaaS invoicing simpel untuk freelancer. Ada fitur buat invoice PDF, daftar klien, dan laporan bulanan.&quot;
        </div>
      </div>
    ),
  },
  {
    id: "clarify",
    tabLabel: "2. Klarifikasi AI",
    badge: "2-3 Pertanyaan Tajam",
    title: "AI Architect Asking",
    content: (
      <div className="flex flex-col gap-3 font-sans text-small">
        <div className="rounded-2xl rounded-tl-xs border border-border bg-card p-4 shadow-warm-xs">
          <p className="font-semibold text-brand-stronger">AI Architect:</p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-muted-foreground">
            <li>Apakah format penomoran invoice bisa di-custom per user?</li>
            <li>Apakah status pembayaran mendukung sistem DP / cicilan?</li>
            <li>Apakah laporan bulanan perlu ekspor ke Excel / CSV?</li>
          </ol>
        </div>
      </div>
    ),
  },
  {
    id: "prd",
    tabLabel: "3. PRD Locked",
    badge: "PRD v1 Locked",
    title: "Single Source of Truth",
    content: (
      <div className="flex flex-col gap-3 font-mono text-tiny">
        <div className="flex items-center justify-between rounded-xl border border-sage-soft-border bg-sage-soft/60 px-3.5 py-2 text-sage-text">
          <span className="font-bold">🔒 PRD v1 Terkunci</span>
          <span className="text-[11px]">3 Entitas · 4 Fitur Inti</span>
        </div>
        <div className="rounded-xl border border-border bg-surface-sunken p-3 text-muted-foreground">
          <p className="font-bold text-foreground"># 1. Ringkasan SaaS Invoicing</p>
          <p className="mt-1">Aplikasi pamungkas pencetak invoice PDF & pelacak pembayaran klien...</p>
        </div>
      </div>
    ),
  },
  {
    id: "prompt",
    tabLabel: "4. Prompt Final",
    badge: "Sekali Jalan Benar",
    title: "Prompt Siap Tempel",
    content: (
      <div className="overflow-hidden rounded-xl border border-border bg-[#1e1916] text-[#f4ece1]">
        <div className="flex items-center justify-between border-b border-[#3a322b] bg-[#28221d] px-3 py-1.5 font-mono text-[11px] text-[#b3a596]">
          <span>final_prompt.md</span>
          <span className="text-sage-text font-semibold">Ready for Claude Code / Cursor</span>
        </div>
        <pre className="p-3.5 font-mono text-[11px] leading-relaxed text-[#f4ece1]/90 whitespace-pre-wrap">
          <span className="text-amber">## TUJUAN TASK #03</span>{"\n"}
          Buat komponen `InvoiceForm` & generator PDF...{"\n"}
          <span className="text-amber">## KONTEKS RELEVAN</span>{"\n"}
          Entity: Invoice, InvoiceItem, Client...{"\n"}
          <span className="text-amber">## ACCEPTANCE CRITERIA</span>{"\n"}
          ✓ Invoice bisa diekspor PDF dengan margin rapi.
        </pre>
      </div>
    ),
  },
];

export function InteractiveHeroPreview() {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const stage = STAGES[activeTab];

  return (
    <div className="relative animate-scale-in">
      {/* Radiant Background Blur */}
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-brand-soft via-amber-soft/40 to-sage-soft blur-2xl"
      />

      {/* Main Preview Card Window */}
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-warm-lg transition-warm hover:shadow-warm-brand/20">
        {/* Top Window Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-sunken/60 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-[#e86a58]" />
            <span className="size-3 rounded-full bg-[#e5a24b]" />
            <span className="size-3 rounded-full bg-[#7fa88a]" />
            <span className="ml-2 font-mono text-tiny text-muted-foreground">
              bisavibecoding-workspace
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="success" className="animate-pulse">
              ● Live Preview Simulator
            </Badge>
          </div>
        </div>

        {/* Interactive Stage Selector Tabs */}
        <div className="flex overflow-x-auto border-b border-border bg-surface-sunken/30 p-1.5">
          {STAGES.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveTab(idx)}
              className={`flex-1 min-w-28 rounded-xl px-3 py-2 text-tiny font-semibold transition-warm ${
                activeTab === idx
                  ? "bg-card text-brand-stronger shadow-warm-xs border border-brand-soft-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.tabLabel}
            </button>
          ))}
        </div>

        {/* Active Stage Body */}
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="font-heading text-h3 text-foreground">{stage.title}</h4>
            <Badge variant="secondary">{stage.badge}</Badge>
          </div>

          <div className="min-h-48">{stage.content}</div>

          {/* Action Bar Footer */}
          <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-tiny text-muted-foreground">
            <span>Klik tab di atas untuk mensimulasikan alur 4-langkah.</span>
            {activeTab === 3 ? (
              <Button
                size="sm"
                onClick={() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? "✓ Prompt Disalin!" : "📋 Salin Prompt"}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Floating Pill Badges */}
      <div
        aria-hidden
        className="animate-float absolute -top-6 -left-8 hidden rounded-2xl border border-sage-soft-border bg-sage-soft px-4 py-2.5 text-tiny font-semibold text-sage-text shadow-warm-md lg:block"
        style={{ "--tilt": "-4deg", "--stagger": 1 } as React.CSSProperties}
      >
        🔒 PRD v1 Terkunci
      </div>

      <div
        aria-hidden
        className="animate-float absolute -right-8 -bottom-6 hidden rounded-2xl border border-brand-soft-border bg-brand-soft px-4 py-2.5 text-tiny font-semibold text-brand-stronger shadow-warm-md lg:block"
        style={{ "--tilt": "4deg", "--stagger": 2 } as React.CSSProperties}
      >
        ⚡ Task Self-Contained
      </div>
    </div>
  );
}
