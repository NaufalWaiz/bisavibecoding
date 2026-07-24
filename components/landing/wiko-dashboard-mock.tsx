"use client";

import { useState, useEffect } from "react";
import {
  Lock,
  Globe,
  Calendar,
  BarChart3,
  FileText,
  Zap,
  CheckCircle2,
  Cpu,
  TrendingUp,
  Copy,
  Check,
  Terminal,
  Sparkles,
  Layers,
} from "lucide-react";

export function WikoDashboardMock() {
  const [activeTab, setActiveTab] = useState<"overview" | "prd" | "tasks">("overview");
  const [copied, setCopied] = useState(false);
  const [typedText, setTypedText] = useState("");
  const fullPromptText = `## TUJUAN TASK #03
Implementasikan fitur pembuatan invoice baru dan ekspor berkas PDF.

## KONTEKS RELEVAN (AUTOMATICALLY ATTACHED)
- Files: \`app/invoices/new/page.tsx\`, \`lib/pdf.ts\`
- Data Schema: Client, Invoice, InvoiceItem (Strict DB Relations)

## ACCEPTANCE CRITERIA
✓ User bisa mengisi item invoice dan total otomatis terhitung.
✓ Tombol "Cetak PDF" menghasilkan dokumen invoice yang bersih.`;

  // Animated typewriter effect when terminal tab is selected
  useEffect(() => {
    if (activeTab !== "tasks") {
      setTypedText("");
      return;
    }
    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < fullPromptText.length) {
        setTypedText(fullPromptText.slice(0, currentIdx + 6));
        currentIdx += 6;
      } else {
        setTypedText(fullPromptText);
        clearInterval(interval);
      }
    }, 15);

    return () => clearInterval(interval);
  }, [activeTab, fullPromptText]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullPromptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-black/10 bg-white shadow-warm-lg transition-all duration-500 hover:shadow-warm-brand/30 hover:border-brand-soft-border group">
      {/* Dynamic Background Ambient Light Sweep */}
      <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-gradient-to-br from-brand/10 via-amber/10 to-transparent blur-3xl transition-transform duration-1000 group-hover:scale-125" />

      {/* Top App Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 bg-[#faf8f5] px-6 py-4 text-tiny text-muted-foreground">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-[#ff5f56] transition-transform hover:scale-125" />
            <span className="size-3 rounded-full bg-[#ffbd2e] transition-transform hover:scale-125" />
            <span className="size-3 rounded-full bg-[#27c93f] transition-transform hover:scale-125" />
          </div>
          <span className="font-mono text-tiny font-medium text-foreground">
            bisavibecoding.app / SaaS Invoicing
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sage-soft-border bg-sage-soft px-3 py-0.5 text-tiny font-semibold text-sage-text shadow-warm-xs">
            <Lock className="size-3 text-sage-strong" />
            PRD v1 Locked
          </span>
        </div>

        <div className="flex items-center gap-3 font-medium">
          <span className="inline-flex items-center gap-1.5 text-foreground">
            <Calendar className="size-3.5 text-muted-foreground" />
            24 Juli 2026
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2.5 py-1 text-foreground shadow-warm-xs">
            <Globe className="size-3.5 text-brand-stronger" />
            Indonesia
          </span>
        </div>
      </div>

      {/* Main App Workspace Grid */}
      <div className="grid min-h-[440px] lg:grid-cols-[230px_1fr]">
        {/* Left App Sidebar */}
        <aside className="hidden border-r border-border/60 bg-[#faf8f5]/60 p-4 lg:flex lg:flex-col lg:justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Workspace Navigation
            </div>
            {[
              { id: "overview", label: "Overview", icon: BarChart3, badge: "100%" },
              { id: "prd", label: "PRD Editor", icon: FileText, badge: "v1 Locked" },
              { id: "tasks", label: "Task Ready", icon: Zap, badge: "4 Task" },
            ].map(({ id, label, icon: Icon, badge }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id as "overview" | "prd" | "tasks")}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-tiny font-semibold transition-all duration-200 ${
                  activeTab === id
                    ? "bg-white text-brand-stronger shadow-warm-xs border border-border/80 translate-x-1"
                    : "text-muted-foreground hover:bg-white/70 hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className={`size-4 ${activeTab === id ? "text-brand-stronger" : "text-muted-foreground"}`} />
                  {label}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground bg-surface-sunken px-1.5 py-0.5 rounded">
                  {badge}
                </span>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-brand-soft-border bg-brand-soft p-4 text-tiny shadow-warm-xs relative overflow-hidden">
            <div className="flex items-center gap-2 font-bold text-brand-stronger">
              <Sparkles className="size-4 animate-spin text-brand-strong" style={{ animationDuration: "8s" }} />
              AI Architect Active
            </div>
            <p className="mt-1.5 text-muted-foreground text-[11px] leading-relaxed">
              Siap menghasilkan prompt sekali jalan benar untuk Claude Code & Cursor.
            </p>
          </div>
        </aside>

        {/* Right Main Panel Content with Smooth Entrance Animations */}
        <main className="p-6">
          {activeTab === "overview" && (
            <div className="flex flex-col gap-6 animate-scale-in">
              {/* Top Stats Cards Row */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/80 bg-[#fbf9f6] p-5 shadow-warm-xs transition-all duration-300 hover:border-brand-soft-border hover:shadow-warm-sm hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-tiny font-medium text-muted-foreground">
                      Sekali Jalan Benar
                    </span>
                    <TrendingUp className="size-4 text-sage-strong" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-heading text-h1 text-sage-text">94.8%</span>
                    <span className="text-tiny font-semibold text-sage-strong">↑ 12% vs biasa</span>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
                    <div className="h-full w-[94%] rounded-full bg-sage-strong transition-all duration-1000 ease-out" />
                  </div>
                </div>

                <div className="rounded-2xl border border-border/80 bg-[#fbf9f6] p-5 shadow-warm-xs transition-all duration-300 hover:border-brand-soft-border hover:shadow-warm-sm hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-tiny font-medium text-muted-foreground">
                      Total Task Ready
                    </span>
                    <CheckCircle2 className="size-4 text-brand-stronger" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-heading text-h1 text-foreground">4 Task</span>
                    <span className="text-tiny text-muted-foreground">0 stale</span>
                  </div>
                  <p className="mt-3 text-tiny text-muted-foreground">
                    Semua task terhubung ke PRD v1
                  </p>
                </div>

                <div className="rounded-2xl border border-border/80 bg-[#fbf9f6] p-5 shadow-warm-xs transition-all duration-300 hover:border-brand-soft-border hover:shadow-warm-sm hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-tiny font-medium text-muted-foreground">
                      AI Agent Target
                    </span>
                    <Cpu className="size-4 text-amber-text" />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {["Claude Code", "Cursor", "Windsurf"].map((target) => (
                      <span
                        key={target}
                        className="rounded-lg border border-border bg-white px-2 py-1 text-tiny font-semibold text-foreground transition-transform hover:scale-105"
                      >
                        {target}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-tiny text-muted-foreground">
                    Ready to copy final prompt
                  </p>
                </div>
              </div>

              {/* Task Cards Pipeline Mock */}
              <div className="rounded-2xl border border-border p-5 bg-white shadow-warm-xs">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <h4 className="font-heading text-h3 text-foreground flex items-center gap-2">
                    <Layers className="size-4 text-brand-stronger" />
                    Daftar Task Mandiri (Self-Contained)
                  </h4>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-soft-border bg-brand-soft px-3 py-0.5 text-tiny font-semibold text-brand-stronger">
                    <Lock className="size-3" />
                    PRD v1 Locked
                  </span>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  {[
                    [
                      "01",
                      "Setup Skema Database & Auth Supabase",
                      "Tables: users, invoices, clients",
                      "Todo",
                    ],
                    [
                      "02",
                      "Halaman Dashboard & Tabel Invoice List",
                      "Components: InvoiceTable, StatCards",
                      "Done",
                    ],
                    [
                      "03",
                      "Generator PDF & Form Input Invoice",
                      "Files: lib/pdf.ts, components/invoice-form.tsx",
                      "In Progress",
                    ],
                  ].map(([num, title, desc, status]) => (
                    <div
                      key={num}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-white p-3.5 transition-all duration-200 hover:border-brand-soft-border hover:shadow-warm-xs hover:translate-x-1"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-brand-soft font-mono text-tiny font-bold text-brand-stronger">
                          {num}
                        </span>
                        <div>
                          <div className="text-small font-semibold text-foreground">
                            {title}
                          </div>
                          <div className="text-tiny text-muted-foreground">{desc}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-border bg-surface-sunken px-2.5 py-0.5 text-tiny font-medium text-muted-foreground">
                          {status}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveTab("tasks")}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-soft-border bg-brand-soft px-3 py-1 text-tiny font-semibold text-brand-stronger transition-all hover:bg-brand-strong hover:text-white cursor-pointer"
                        >
                          <Copy className="size-3" />
                          Salin Prompt
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "prd" && (
            <div className="rounded-2xl border border-border p-5 bg-white shadow-warm-xs animate-scale-in">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="font-heading text-h3 text-foreground flex items-center gap-2">
                  <FileText className="size-4 text-brand-stronger" />
                  PRD Document Viewer
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-sage-soft px-3 py-1 text-tiny font-semibold text-sage-text border border-sage-soft-border">
                  <Lock className="size-3" />
                  Locked (v1)
                </span>
              </div>
              <div className="mt-4 space-y-3 text-small leading-relaxed text-muted-foreground font-sans">
                <h3 className="font-heading text-h2 text-foreground"># 1. SaaS Invoicing MVP</h3>
                <p>
                  Aplikasi web invoicing khusus freelancer untuk mencetak invoice PDF, mengelola
                  daftar klien, dan mengirimkan link pembayaran.
                </p>
                <h4 className="font-bold text-foreground">## 2. Entitas Data Utama</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Client (id, name, email, address, created_at)</li>
                  <li>Invoice (id, client_id, invoice_number, total_amount, status)</li>
                  <li>InvoiceItem (id, invoice_id, description, quantity, price)</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "tasks" && (
            <div className="overflow-hidden rounded-2xl border border-border bg-[#1e1916] text-[#f4ece1] p-5 font-mono text-tiny shadow-warm-md animate-scale-in">
              <div className="flex items-center justify-between border-b border-[#3a322b] pb-3 text-[#b3a596]">
                <span className="flex items-center gap-2 text-foreground font-semibold">
                  <Terminal className="size-4 text-brand-stronger" />
                  final_prompt.md (Task #03)
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-lg border border-[#3a322b] bg-[#2b2521] px-3 py-1 text-tiny font-sans font-semibold text-[#f4ece1] transition-all hover:bg-brand-strong hover:text-white"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 text-sage-strong" /> Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" /> Salin Prompt
                    </>
                  )}
                </button>
              </div>

              {/* Animated Live Typing Window */}
              <div className="mt-4 leading-relaxed whitespace-pre-wrap text-[#f4ece1]/90 min-h-[220px]">
                {typedText}
                <span className="inline-block w-2 h-4 ml-1 bg-brand-strong animate-cursor-blink align-middle" />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
