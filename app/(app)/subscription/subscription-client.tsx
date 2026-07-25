"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Check,
  Zap,
  Sparkles,
  Flame,
  Crown,
  Gift,
  ArrowLeft,
  QrCode,
  Building2,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Clock,
  X,
  Lock,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { updateSubscriptionPlanAction } from "./actions";

type PlanKey = "free" | "starter" | "pro" | "ultra";

interface PlanDetails {
  key: PlanKey;
  name: string;
  price: string;
  numericPrice: number;
  prdLimit: string;
  numericPrdLimit: number | "unlimited";
  description: string;
  recommended?: boolean;
  features: string[];
}

const PLANS: PlanDetails[] = [
  {
    key: "free",
    name: "Free Plan",
    price: "GRATIS AJA",
    numericPrice: 0,
    prdLimit: "3 PRD / bulan",
    numericPrdLimit: 3,
    description: "Untuk uji coba pertama kali dan eksplorasi alur kerja.",
    features: [
      "3 PRD terstruktur per bulan",
      "Basic Task Breakdown Prompts",
      "Ekspor CLAUDE.md dasar",
      "Akses Standar AI Architect",
    ],
  },
  {
    key: "starter",
    name: "Starter Plan",
    price: "Rp 15.000",
    numericPrice: 15000,
    prdLimit: "20 PRD / bulan",
    numericPrdLimit: 20,
    description: "Cocok untuk solo developer & indie hacker yang baru mulai.",
    features: [
      "20 PRD terstruktur per bulan",
      "Unlimited Breakdown Task Prompts",
      "Ekspor CLAUDE.md & rules",
      "Dukungan Claude Code, Cursor & Windsurf",
    ],
  },
  {
    key: "pro",
    name: "Pro Plan",
    price: "Rp 30.000",
    numericPrice: 30000,
    prdLimit: "50 PRD / bulan",
    numericPrdLimit: 50,
    description: "Untuk vibe coder aktif & builder SaaS berkecepatan tinggi.",
    recommended: true,
    features: [
      "50 PRD terstruktur per bulan",
      "Akses Premium AI Architect Engine",
      "PRD Lock & Unlimited Versioning",
      "Fast-track Task Breakdown Prompts",
      "Ekspor Lengkap Aturan Repo",
    ],
  },
  {
    key: "ultra",
    name: "Ultra Plan",
    price: "Rp 60.000",
    numericPrice: 60000,
    prdLimit: "Unlimited PRD",
    numericPrdLimit: "unlimited",
    description: "Performa tanpa batas untuk studio, agency, dan power user.",
    features: [
      "UNLIMITED PRD selama sebulan",
      "Model AI Architect Kualitas Tertinggi",
      "Bebas Kuota Breakdown Task Prompt",
      "Ekspor Aturan Custom Multi-Repo",
      "Priority Processing & Fast Support",
    ],
  },
];

export function SubscriptionClient({
  userEmail,
  initialPlan = "free",
  initialPrdCount = 0,
}: {
  userEmail: string;
  initialPlan?: string;
  initialPrdCount?: number;
}) {
  const [currentPlan, setCurrentPlan] = useState<PlanKey>(
    (initialPlan as PlanKey) ?? "free",
  );
  const [usedPrdCount, setUsedPrdCount] = useState<number>(initialPrdCount);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<PlanDetails | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"qris" | "bca" | "gopay">("qris");
  const [isProcessing, setIsProcessing] = useState(false);

  const activePlanDetails = PLANS.find((p) => p.key === currentPlan) ?? PLANS[0];

  function handleUpgradeClick(plan: PlanDetails) {
    if (plan.key === currentPlan) {
      toast.info(`Kamu sudah berada di paket ${plan.name}`);
      return;
    }
    setSelectedPlanForCheckout(plan);
  }

  async function confirmPayment() {
    if (!selectedPlanForCheckout) return;
    setIsProcessing(true);

    const res = await updateSubscriptionPlanAction(selectedPlanForCheckout.key);
    if (res.error) {
      toast.error(res.error);
      setIsProcessing(false);
      return;
    }

    setCurrentPlan(selectedPlanForCheckout.key);
    setIsProcessing(false);
    setSelectedPlanForCheckout(null);
    toast.success(`Selamat! Akunmu berhasil ditingkatkan ke ${selectedPlanForCheckout.name}.`);
  }

  function copyToClipboard(text: string, label: string) {
    void navigator.clipboard.writeText(text);
    toast.success(`${label} berhasil disalin!`);
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      {/* Back Button & Page Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/projects"
          className="flex size-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-warm-xs transition-warm hover:bg-surface-raised hover:text-foreground"
          title="Kembali ke Dashboard"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <span className="text-tiny font-semibold text-muted-foreground">Kembali ke Dashboard</span>
      </div>

      <PageHeader
        icon={CreditCard}
        eyebrow="Tingkat Berlangganan"
        title="Paket & Kuota Berlangganan"
        description="Kelola paket langganan aktif, pantau sisa kuota generasimu, atau tingkatkan paket untuk akses AI tanpa batas."
      />

      {/* Active Subscription Status Banner Card */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-warm-xs sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-soft border border-brand-soft-border text-brand-strong shadow-warm-xs">
              <Sparkles className="size-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="font-heading text-h2 text-foreground">
                  Paket Aktif: {activePlanDetails.name}
                </h2>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sage-soft-border bg-sage-soft px-3 py-0.5 text-tiny font-bold text-sage-text">
                  <CheckCircle2 className="size-3.5" /> Aktif
                </span>
              </div>
              <p className="mt-1 text-tiny text-muted-foreground">
                Terhubung dengan akun: <span className="font-semibold text-foreground">{userEmail}</span>
              </p>
            </div>
          </div>

          {/* Quota Progress Meter */}
          <div className="flex min-w-[280px] flex-col rounded-2xl border border-border/70 bg-surface-sunken/60 p-4">
            <div className="flex items-center justify-between text-tiny">
              <span className="font-semibold text-muted-foreground">Penggunaan Kuota PRD:</span>
              <span className="font-mono font-bold text-foreground">
                {usedPrdCount} / {activePlanDetails.numericPrdLimit === "unlimited" ? "∞" : activePlanDetails.numericPrdLimit} PRD
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-border/60">
              <div
                className="h-full rounded-full bg-brand-strong transition-all duration-500"
                style={{
                  width:
                    activePlanDetails.numericPrdLimit === "unlimited"
                      ? "100%"
                      : `${(usedPrdCount / (activePlanDetails.numericPrdLimit as number)) * 100}%`,
                }}
              />
            </div>

            <p className="mt-2 text-[11px] text-muted-foreground">
              {activePlanDetails.numericPrdLimit === "unlimited"
                ? "Bebas generate PRD tanpa batas kuota."
                : `Sisa kuota: ${(activePlanDetails.numericPrdLimit as number) - usedPrdCount} generasi PRD bulan ini.`}
            </p>
          </div>
        </div>
      </div>

      {/* Pricing 4-Card Grid */}
      <div>
        <div className="mb-4">
          <h3 className="font-heading text-h2 text-foreground">Pilih Paket Upgrade</h3>
          <p className="text-tiny text-muted-foreground">
            Tingkatkan paketmu kapan saja untuk mendapatkan lebih banyak kuota generasi PRD & AI Architect Engine.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:items-stretch">
          {PLANS.map((plan) => {
            const isCurrent = plan.key === currentPlan;

            return (
              <div
                key={plan.key}
                className={cn(
                  "relative flex flex-col justify-between rounded-3xl p-6 shadow-warm-xs transition-all duration-300 h-full",
                  plan.recommended
                    ? "border-2 border-brand-strong bg-gradient-to-b from-card via-card to-brand-soft/30 hover:shadow-warm-lg hover:-translate-y-1.5"
                    : "border border-border/80 bg-card hover:border-brand-strong/40 hover:shadow-warm-md hover:-translate-y-1",
                )}
              >
                {plan.recommended ? (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-brand-strong bg-brand-strong px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-warm-brand">
                      <Flame className="size-3 fill-white text-white" /> Paling Populer
                    </span>
                  </div>
                ) : null}

                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-tiny font-semibold",
                        plan.key === "free"
                          ? "border border-border bg-surface-sunken text-muted-foreground"
                          : plan.key === "starter"
                          ? "border border-brand-soft-border bg-brand-soft text-brand-stronger"
                          : plan.key === "pro"
                          ? "border border-brand-soft-border bg-brand-soft text-brand-stronger font-bold"
                          : "border border-amber-soft-border bg-amber-soft text-amber-text font-bold",
                      )}
                    >
                      {plan.key === "free" && <Gift className="size-3" />}
                      {plan.key === "starter" && <Zap className="size-3 text-brand-strong" />}
                      {plan.key === "pro" && <Sparkles className="size-3 text-brand-strong" />}
                      {plan.key === "ultra" && <Crown className="size-3 text-amber" />}
                      {plan.name}
                    </span>
                  </div>

                  <h4 className="mt-5 font-heading text-h3 text-foreground">{plan.name}</h4>
                  <p className="mt-1 text-tiny text-muted-foreground">{plan.description}</p>

                  <div className="mt-5 flex items-baseline gap-1">
                    <span
                      className={cn(
                        "font-heading text-h1 font-bold",
                        plan.recommended ? "text-brand-stronger" : "text-foreground",
                      )}
                    >
                      {plan.price}
                    </span>
                    <span className="text-tiny text-muted-foreground">/bulan</span>
                  </div>

                  <div
                    className={cn(
                      "mt-3 rounded-xl px-3 py-1.5 font-mono text-tiny font-bold",
                      plan.key === "pro"
                        ? "bg-brand-strong text-white border border-brand-strong/30"
                        : "bg-surface-sunken border border-border text-muted-foreground",
                    )}
                  >
                    {plan.prdLimit}
                  </div>

                  <ul className="mt-5 space-y-2.5 text-tiny text-muted-foreground">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2">
                        <Check className="size-3.5 shrink-0 text-sage-strong font-bold" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={() => handleUpgradeClick(plan)}
                  disabled={isCurrent}
                  variant={isCurrent ? "outline" : plan.recommended ? "default" : "outline"}
                  className={cn(
                    "mt-6 w-full gap-2 rounded-xl text-tiny font-semibold",
                    isCurrent
                      ? "bg-sage-soft text-sage-text border-sage-soft-border opacity-100"
                      : plan.recommended
                      ? "bg-brand-strong text-white hover:bg-brand-stronger"
                      : "hover:bg-brand-strong hover:text-white",
                  )}
                >
                  {isCurrent ? "Paket Saat Ini" : `Pilih ${plan.name}`}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ULTRA-MEWAH CHECKOUT PAYMENT MODAL (FULL SCREEN PORTAL) */}
      {selectedPlanForCheckout && typeof window !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in w-screen h-screen">
              <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border/90 bg-card p-6 shadow-warm-lg sm:p-8 animate-scale-in max-h-[90vh] overflow-y-auto">

            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-border/60 pb-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-brand-soft border border-brand-soft-border text-brand-strong shadow-warm-xs">
                  <CreditCard className="size-5" />
                </span>
                <div>
                  <h3 className="font-heading text-h2 tracking-tight text-foreground">
                    Konfirmasi Pembayaran
                  </h3>
                  <p className="text-tiny text-muted-foreground">
                    Proses instan & terenkripsi aman
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlanForCheckout(null)}
                className="flex size-8 items-center justify-center rounded-full bg-surface-sunken text-muted-foreground transition-warm hover:bg-surface-raised hover:text-foreground"
                title="Tutup dialog"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-6 space-y-5">
              {/* Selected Plan Summary Banner */}
              <div className="rounded-2xl border border-brand-soft-border bg-gradient-to-r from-brand-soft/80 via-brand-soft/30 to-surface p-5 shadow-warm-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-h2 text-foreground">
                        {selectedPlanForCheckout.name}
                      </span>
                      <span className="rounded-full border border-brand-strong/30 bg-brand-strong px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                        {selectedPlanForCheckout.prdLimit}
                      </span>
                    </div>
                    <p className="mt-1 text-tiny text-muted-foreground max-w-[260px]">
                      {selectedPlanForCheckout.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-heading text-h1 font-bold text-brand-stronger leading-none block">
                      {selectedPlanForCheckout.price}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-semibold">
                      / bulan
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector Tabs */}
              <div>
                <label className="flex items-center justify-between text-tiny font-bold text-foreground">
                  <span>Pilih Metode Pembayaran:</span>
                  <span className="text-[11px] font-normal text-muted-foreground flex items-center gap-1">
                    <Lock className="size-3 text-sage-strong" /> Garansi 100% Aman
                  </span>
                </label>

                <div className="mt-2.5 grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("qris")}
                    className={cn(
                      "group flex flex-col items-center justify-center rounded-2xl border p-3.5 text-tiny font-semibold transition-all duration-200",
                      paymentMethod === "qris"
                        ? "border-brand-strong bg-brand-soft/90 text-brand-stronger shadow-warm-xs ring-2 ring-brand-strong/20"
                        : "border-border/80 bg-surface-sunken/60 text-muted-foreground hover:bg-card hover:text-foreground",
                    )}
                  >
                    <div className="flex size-9 items-center justify-center rounded-xl bg-card border border-border shadow-warm-xs mb-1.5 transition-transform group-hover:scale-110">
                      <QrCode className="size-5 text-brand-strong" />
                    </div>
                    <span>QRIS Instant</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("bca")}
                    className={cn(
                      "group flex flex-col items-center justify-center rounded-2xl border p-3.5 text-tiny font-semibold transition-all duration-200",
                      paymentMethod === "bca"
                        ? "border-brand-strong bg-brand-soft/90 text-brand-stronger shadow-warm-xs ring-2 ring-brand-strong/20"
                        : "border-border/80 bg-surface-sunken/60 text-muted-foreground hover:bg-card hover:text-foreground",
                    )}
                  >
                    <div className="flex size-9 items-center justify-center rounded-xl bg-card border border-border shadow-warm-xs mb-1.5 transition-transform group-hover:scale-110">
                      <Building2 className="size-5 text-brand-strong" />
                    </div>
                    <span>Transfer BCA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("gopay")}
                    className={cn(
                      "group flex flex-col items-center justify-center rounded-2xl border p-3.5 text-tiny font-semibold transition-all duration-200",
                      paymentMethod === "gopay"
                        ? "border-brand-strong bg-brand-soft/90 text-brand-stronger shadow-warm-xs ring-2 ring-brand-strong/20"
                        : "border-border/80 bg-surface-sunken/60 text-muted-foreground hover:bg-card hover:text-foreground",
                    )}
                  >
                    <div className="flex size-9 items-center justify-center rounded-xl bg-card border border-border shadow-warm-xs mb-1.5 transition-transform group-hover:scale-110">
                      <Wallet className="size-5 text-brand-strong" />
                    </div>
                    <span>E-Wallet</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Payment Instruction Display */}
              <div className="rounded-2xl border border-border/80 bg-surface-sunken/50 p-5">
                {paymentMethod === "qris" ? (
                  <div className="flex flex-col items-center text-center">
                    <div className="relative flex size-44 items-center justify-center rounded-2xl border-2 border-brand-strong/30 bg-white p-3 shadow-warm-md">
                      {/* Stylized QR Code Graphic */}
                      <QrCode className="size-36 text-slate-900" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="rounded-lg bg-brand-strong px-2 py-0.5 font-mono text-[9px] font-bold text-white shadow-warm-xs">
                          bisa<span className="font-extrabold">vibe</span>
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-1.5 rounded-full border border-amber-soft-border bg-amber-soft px-3 py-1 text-tiny font-semibold text-amber-text">
                      <Clock className="size-3.5" /> Berlaku: 14:59 menit
                    </div>
                    <p className="mt-2 text-tiny text-muted-foreground max-w-xs">
                      Scan QRIS di atas dengan aplikasi <span className="font-semibold text-foreground">GoPay, OVO, Dana, ShopeePay,</span> atau <span className="font-semibold text-foreground">Mobile Banking</span>.
                    </p>
                  </div>
                ) : paymentMethod === "bca" ? (
                  <div className="space-y-3">
                    <span className="text-tiny font-semibold text-muted-foreground">
                      Transfer Bank Manual / m-BCA:
                    </span>
                    <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-3.5 shadow-warm-xs">
                      <div>
                        <span className="text-[11px] text-muted-foreground block font-mono">BCA Virtual Account</span>
                        <span className="font-mono text-h3 font-bold tracking-wider text-foreground">
                          8830 1928 4014
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard("883019284014", "Nomor Rekening BCA")}
                        className="gap-1.5 rounded-lg text-tiny"
                      >
                        <Copy className="size-3.5" /> Salin
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Atas Nama: <span className="font-bold text-foreground">PT BISA VIBE CODING INDONESIA</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <span className="text-tiny font-semibold text-muted-foreground">
                      Transfer E-Wallet (GoPay / OVO / Dana):
                    </span>
                    <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-3.5 shadow-warm-xs">
                      <div>
                        <span className="text-[11px] text-muted-foreground block font-mono">Nomor GoPay / Dana</span>
                        <span className="font-mono text-h3 font-bold tracking-wider text-foreground">
                          0812-3456-7890
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard("081234567890", "Nomor GoPay")}
                        className="gap-1.5 rounded-lg text-tiny"
                      >
                        <Copy className="size-3.5" /> Salin
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Konfirmasi otomatis setelah pembayaran berhasil diterima.
                    </p>
                  </div>
                )}
              </div>

              {/* Total Summary */}
              <div className="flex items-center justify-between border-t border-border/60 pt-3 text-tiny">
                <span className="text-muted-foreground">Total Tagihan (termasuk PPN 0%):</span>
                <span className="font-heading text-h2 font-bold text-foreground">
                  {selectedPlanForCheckout.price}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center gap-3">
              <Button
                variant="outline"
                className="w-1/3 rounded-2xl h-11 text-tiny font-semibold"
                onClick={() => setSelectedPlanForCheckout(null)}
                disabled={isProcessing}
              >
                Batal
              </Button>
              <Button
                className="w-2/3 rounded-2xl h-11 bg-brand-strong text-white shadow-warm-brand transition-all duration-300 hover:bg-brand-stronger hover:shadow-warm-lg text-tiny font-bold gap-2"
                onClick={confirmPayment}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  "Memproses Pembayaran..."
                ) : (
                  <>
                    Konfirmasi Bayar <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null}
    </div>
  );
}
