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
    <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl transition-all duration-500 hover:border-[#BEF264]/60 group">
      {/* Dynamic Background Ambient Light Sweep */}
      <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-linear-to-br from-[#BEF264]/15 via-emerald-500/8 to-transparent blur-3xl transition-transform duration-1000 group-hover:scale-125" />

      {/* Top App Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 border-b border-slate-100 bg-slate-50/80 px-4 sm:px-6 py-3 sm:py-4 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-[#ff5f56] transition-transform hover:scale-125" />
            <span className="size-3 rounded-full bg-[#ffbd2e] transition-transform hover:scale-125" />
            <span className="size-3 rounded-full bg-[#27c93f] transition-transform hover:scale-125" />
          </div>
          <span className="font-mono text-[11px] sm:text-xs font-bold text-[#0F172A] truncate max-w-[200px] sm:max-w-none">
            bisavibecoding.app / SaaS Invoicing
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D9F99D] bg-[#F7FEE7] px-2.5 py-0.5 text-[10px] sm:text-[11px] font-extrabold text-[#3F6212] shadow-xs">
            <Lock className="size-3 text-[#3F6212]" />
            PRD v1 Locked
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-3 font-semibold">
          <span className="inline-flex items-center gap-1.5 text-[#0F172A]">
            <Calendar className="size-3.5 text-slate-400" />
            24 Juli 2026
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[#0F172A] shadow-xs">
            <Globe className="size-3.5 text-[#3F6212]" />
            Indonesia
          </span>
        </div>
      </div>

      {/* Main App Workspace Grid */}
      <div className="grid min-h-[440px] lg:grid-cols-[230px_1fr]">
        {/* Left App Sidebar */}
        <aside className="hidden border-r border-slate-100 bg-slate-50/50 p-4 lg:flex lg:flex-col lg:justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
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
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                  activeTab === id
                    ? "bg-white text-[#0F172A] shadow-sm border border-slate-200/80 translate-x-1"
                    : "text-slate-500 hover:bg-white/70 hover:text-[#0F172A]"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className={`size-4 ${activeTab === id ? "text-[#059669]" : "text-slate-400"}`} />
                  {label}
                </span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  {badge}
                </span>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-[#D9F99D] bg-[#F7FEE7] p-4 text-xs shadow-xs">
            <div className="flex items-center gap-2 font-bold text-[#3F6212]">
              <Sparkles className="size-4 animate-spin text-[#3F6212]" style={{ animationDuration: "8s" }} />
              AI Architect Active
            </div>
            <p className="mt-1.5 text-slate-500 text-[11px] leading-relaxed">
              Siap menghasilkan prompt sekali jalan benar untuk Claude Code & Cursor.
            </p>
          </div>
        </aside>

        {/* Right Main Panel */}
        <main className="p-4 sm:p-6">
          {/* Mobile Tab Selector (Visible on screens < lg) */}
          <div className="mb-5 flex items-center gap-1.5 overflow-x-auto rounded-2xl bg-slate-100/80 p-1.5 lg:hidden no-scrollbar">
            {[
              { id: "overview", label: "Ringkasan", icon: BarChart3 },
              { id: "prd", label: "PRD Editor", icon: FileText },
              { id: "tasks", label: "Task Ready", icon: Zap },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id as "overview" | "prd" | "tasks")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === id
                    ? "bg-[#0F172A] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <Icon className={`size-3.5 ${activeTab === id ? "text-[#BEF264]" : "text-slate-400"}`} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div className="flex flex-col gap-6 animate-scale-in">
              {/* Top Stats Cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-300 hover:border-[#BEF264]/60 hover:shadow-md hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">
                      Sekali Jalan Benar
                    </span>
                    <TrendingUp className="size-4 text-[#3F6212]" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-[#0F172A]">94.8%</span>
                    <span className="text-xs font-bold text-[#3F6212]">↑ 12% vs biasa</span>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-[94%] rounded-full bg-[#BEF264] transition-all duration-1000 ease-out" />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-300 hover:border-[#BEF264]/60 hover:shadow-md hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">
                      Total Task Ready
                    </span>
                    <CheckCircle2 className="size-4 text-[#059669]" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-[#0F172A]">4 Task</span>
                    <span className="text-xs text-slate-400">0 stale</span>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    Semua task terhubung ke PRD v1
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-300 hover:border-[#BEF264]/60 hover:shadow-md hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">
                      AI Agent Target
                    </span>
                    <Cpu className="size-4 text-amber-500" />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {["Claude Code", "Cursor", "Windsurf"].map((target) => (
                      <span
                        key={target}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-[#0F172A] transition-transform hover:scale-105"
                      >
                        {target}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    Ready to copy final prompt
                  </p>
                </div>
              </div>

              {/* Task Cards Pipeline */}
              <div className="rounded-2xl border border-slate-200 p-5 bg-white shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-2">
                    <Layers className="size-4 text-[#059669]" />
                    Daftar Task Mandiri (Self-Contained)
                  </h4>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D9F99D] bg-[#F7FEE7] px-3 py-0.5 text-xs font-bold text-[#3F6212]">
                    <Lock className="size-3" />
                    PRD v1 Locked
                  </span>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  {[
                    ["01", "Setup Skema Database & Auth Supabase", "Tables: users, invoices, clients", "Done"],
                    ["02", "Halaman Dashboard & Tabel Invoice List", "Components: InvoiceTable, StatCards", "Done"],
                    ["03", "Generator PDF & Form Input Invoice", "Files: lib/pdf.ts, components/invoice-form.tsx", "In Progress"],
                  ].map(([num, title, desc, status]) => (
                    <div
                      key={num}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3.5 transition-all duration-200 hover:border-[#BEF264]/50 hover:shadow-xs hover:translate-x-1"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-[#F7FEE7] font-mono text-xs font-bold text-[#3F6212]">
                          {num}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-[#0F172A]">{title}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{desc}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-bold text-slate-500">
                          {status}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveTab("tasks")}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#D9F99D] bg-[#F7FEE7] px-3 py-1 text-xs font-bold text-[#3F6212] transition-all hover:bg-[#BEF264] hover:text-[#0F172A] cursor-pointer"
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
            <div className="rounded-2xl border border-slate-200 p-5 bg-white shadow-xs animate-scale-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-extrabold text-sm text-[#0F172A] flex items-center gap-2">
                  <FileText className="size-4 text-[#059669]" />
                  PRD Document Viewer
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F7FEE7] px-3 py-1 text-xs font-bold text-[#3F6212] border border-[#D9F99D]">
                  <Lock className="size-3" />
                  Locked (v1)
                </span>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
                <h3 className="font-extrabold text-base text-[#0F172A]"># 1. SaaS Invoicing MVP</h3>
                <p>
                  Aplikasi web invoicing khusus freelancer untuk mencetak invoice PDF, mengelola
                  daftar klien, dan mengirimkan link pembayaran.
                </p>
                <h4 className="font-bold text-[#0F172A]">## 2. Entitas Data Utama</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-500">
                  <li>Client (id, name, email, address, created_at)</li>
                  <li>Invoice (id, client_id, invoice_number, total_amount, status)</li>
                  <li>InvoiceItem (id, invoice_id, description, quantity, price)</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "tasks" && (
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0F172A] text-slate-100 p-5 font-mono text-xs shadow-lg animate-scale-in">
              <div className="flex items-center justify-between border-b border-slate-700/50 pb-3 text-slate-400">
                <span className="flex items-center gap-2 text-white font-bold">
                  <Terminal className="size-4 text-[#BEF264]" />
                  final_prompt.md (Task #03)
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#1E293B] px-3 py-1 text-xs font-sans font-bold text-slate-100 transition-all hover:bg-[#BEF264] hover:text-[#0F172A]"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 text-[#BEF264]" /> Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" /> Salin Prompt
                    </>
                  )}
                </button>
              </div>

              {/* Animated Live Typing Window */}
              <div className="mt-4 leading-relaxed whitespace-pre-wrap text-slate-200 min-h-[220px]">
                {typedText}
                <span className="inline-block w-2 h-4 ml-1 bg-[#BEF264] animate-cursor-blink align-middle" />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
