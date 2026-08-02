"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";

function NavigationProgressContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Menyelesaikan progress bar setiap kali rute berhasil berganti
  useEffect(() => {
    if (loading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Mengamati klik pada tautan internal untuk langsung memicu progress bar
  useEffect(() => {
    function handleAnchorClick(e: MouseEvent) {
      const target = e.currentTarget as HTMLAnchorElement;
      if (!target) return;
      const href = target.getAttribute("href");
      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("#") &&
        href !== pathname
      ) {
        setLoading(true);
        setProgress(35);
        setTimeout(() => setProgress(75), 180);
      }
    }

    const anchors = document.querySelectorAll("a[href^='/']");
    anchors.forEach((a) =>
      a.addEventListener("click", handleAnchorClick as EventListener)
    );

    return () => {
      anchors.forEach((a) =>
        a.removeEventListener("click", handleAnchorClick as EventListener)
      );
    };
  }, [pathname]);

  // Mendengarkan event navigasi kustom
  useEffect(() => {
    function handleStart() {
      setLoading(true);
      setProgress(35);
      setTimeout(() => setProgress(75), 180);
    }
    function handleEnd() {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 300);
    }

    window.addEventListener("bvc:nav-start", handleStart);
    window.addEventListener("bvc:nav-end", handleEnd);
    return () => {
      window.removeEventListener("bvc:nav-start", handleStart);
      window.removeEventListener("bvc:nav-end", handleEnd);
    };
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div className="pointer-events-none fixed top-0 left-0 right-0 z-50">
      {/* Top Thin Glowing Progress Bar */}
      <div
        className="h-1 bg-gradient-to-r from-brand via-[#a3e635] to-emerald-500 transition-all duration-300 ease-out shadow-[0_0_12px_rgba(190,242,100,0.8)]"
        style={{ width: `${progress}%` }}
      />
      {/* Indicator Badge Ringkas di Pojok Atas */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-2.5 right-4 flex items-center gap-2 rounded-full border border-brand-soft-border bg-[#0F172A] px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-warm-md"
          >
            <span className="size-2 rounded-full bg-brand animate-ping" />
            <span>Memuat halaman…</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressContent />
    </Suspense>
  );
}

export function triggerNavProgress() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("bvc:nav-start"));
  }
}
