"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { triggerNavProgress } from "@/components/ui/navigation-progress";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowUpRight,
  Sparkles,
  Zap,
  Layers,
  HelpCircle,
  Tag,
  LogIn,
  X,
  Menu,
} from "lucide-react";

const NAV_LINKS = [
  { href: "#pipeline", label: "Alur Kerja", icon: Layers, badge: "4 Langkah" },
  { href: "#features", label: "Fitur", icon: Zap },
  { href: "#pricing", label: "Harga", icon: Tag, badge: "Diskon" },
  { href: "#faq", label: "FAQ", icon: HelpCircle },
];

export function LandingNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll detection for subtle header enhancement
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close mobile menu on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    if (href.startsWith("#")) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <>
      <header
        className={`sticky top-3 sm:top-4 z-50 mx-auto w-[calc(100%-1.5rem)] max-w-4xl rounded-full border border-slate-200/80 bg-white/90 px-4 sm:px-6 py-2.5 backdrop-blur-xl transition-all duration-300 ${
          scrolled
            ? "shadow-[0_14px_36px_rgba(15,23,42,0.12)] bg-white/95 border-slate-300"
            : "shadow-[0_6px_24px_rgba(15,23,42,0.05)]"
        }`}
      >
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2 shrink-0">
            <Logo
              markClassName="size-7 rounded-lg transition-transform group-hover:scale-105"
              wordmarkClassName="text-sm sm:text-base font-extrabold text-[#0F172A] tracking-tight"
              gradientId="bvc-floating-logo"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-6 text-xs font-bold text-slate-600 sm:flex lg:gap-7">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                className="transition-colors hover:text-[#059669]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Right Action Buttons */}
          <div className="hidden items-center gap-2.5 sm:flex sm:gap-3">
            <Link
              href="/login"
              onClick={() => triggerNavProgress()}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:text-[#059669]"
            >
              Masuk
            </Link>

            <Link
              href="/register"
              onClick={() => triggerNavProgress()}
              className="group inline-flex items-center gap-1.5 rounded-full bg-[#BEF264] pl-3.5 pr-1.5 py-1.5 text-xs font-extrabold text-[#0F172A] shadow-xs transition-all hover:bg-[#a3e635] hover:scale-[1.02] active:scale-95"
            >
              <span>Mulai Gratis</span>
              <div className="flex size-5 items-center justify-center rounded-full bg-[#0F172A] transition-transform group-hover:translate-x-0.5">
                <ArrowUpRight className="size-3 text-[#BEF264]" />
              </div>
            </Link>
          </div>

          {/* Mobile Right Bar: Mini CTA + Interactive Burger Toggle Button */}
          <div className="flex items-center gap-2 sm:hidden">
            <Link
              href="/register"
              onClick={() => triggerNavProgress()}
              className="inline-flex items-center gap-1 rounded-full bg-[#BEF264] px-3 py-1 text-[11px] font-extrabold text-[#0F172A] shadow-xs hover:bg-[#a3e635]"
            >
              <span>Mulai</span>
              <ArrowUpRight className="size-3" />
            </Link>

            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              aria-expanded={isOpen}
              aria-label={isOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
              className="flex size-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100/80 text-[#0F172A] transition-colors hover:bg-slate-200/80 active:scale-95 cursor-pointer"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X className="size-4.5 stroke-[2.5]" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0, scale: 0.8 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: -90, opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Menu className="size-4.5 stroke-[2.5]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* Interactive Mobile Navigation Drawer / Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 sm:hidden">
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-md"
            />

            {/* Mobile Sheet Floating Container */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-3 top-3 z-50 overflow-hidden rounded-3xl border border-slate-700/50 bg-[#0F172A] p-5 text-white shadow-2xl backdrop-blur-2xl"
            >
              {/* Header inside Mobile Drawer */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <Link
                  href="/"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2"
                >
                  <Logo
                    markClassName="size-7 rounded-lg"
                    wordmarkClassName="text-sm font-extrabold text-white tracking-tight"
                    gradientId="bvc-mobile-logo"
                  />
                </Link>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Vibe Engine v1.0
                  </span>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label="Tutup menu"
                    className="flex size-8 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              {/* Navigation Links Grid / List */}
              <nav className="my-5 space-y-1.5">
                {NAV_LINKS.map((link, idx) => {
                  const Icon = link.icon;
                  return (
                    <motion.a
                      key={link.href}
                      href={link.href}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 + 0.05 }}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavClick(link.href);
                      }}
                      className="group flex items-center justify-between rounded-2xl border border-transparent bg-slate-900/60 px-4 py-3 text-sm font-semibold text-slate-200 transition-all hover:border-slate-700 hover:bg-slate-800/80 hover:text-white active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-xl bg-slate-800 text-[#BEF264] group-hover:bg-[#BEF264] group-hover:text-[#0F172A] transition-colors">
                          <Icon className="size-4" />
                        </div>
                        <span>{link.label}</span>
                      </div>

                      {link.badge ? (
                        <span className="rounded-full bg-[#BEF264]/20 border border-[#BEF264]/40 px-2 py-0.5 text-[10px] font-extrabold text-[#BEF264]">
                          {link.badge}
                        </span>
                      ) : (
                        <span className="text-slate-500 group-hover:translate-x-0.5 group-hover:text-slate-300 transition-all">
                          →
                        </span>
                      )}
                    </motion.a>
                  );
                })}
              </nav>

              {/* Mobile CTA Footer */}
              <div className="space-y-2 border-t border-slate-800 pt-4">
                <Link
                  href="/register"
                  onClick={() => {
                    setIsOpen(false);
                    triggerNavProgress();
                  }}
                  className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#BEF264] py-3 text-sm font-extrabold text-[#0F172A] shadow-md transition-all hover:bg-[#a3e635] active:scale-[0.98]"
                >
                  <Sparkles className="size-4 text-[#0F172A]" />
                  <span>Mulai Gratis Sekarang</span>
                  <ArrowUpRight className="size-4 text-[#0F172A] transition-transform group-hover:translate-x-0.5" />
                </Link>

                <Link
                  href="/login"
                  onClick={() => {
                    setIsOpen(false);
                    triggerNavProgress();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/40 py-2.5 text-xs font-bold text-slate-300 transition-all hover:border-slate-700 hover:text-white"
                >
                  <LogIn className="size-3.5" />
                  <span>Sudah punya akun? Masuk</span>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
