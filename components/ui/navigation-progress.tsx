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
    <div className="pointer-events-none fixed top-0 left-0 right-0 z-[99999]">
      {/* Top Thin Glowing Progress Bar */}
      <div
        className="h-1 bg-linear-to-r from-[#BEF264] via-emerald-400 to-[#a3e635] transition-all duration-300 ease-out shadow-[0_0_16px_rgba(190,242,100,0.9)]"
        style={{ width: `${progress}%` }}
      />
      {/* Floating Indicator Badge Below Navbar */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-16 right-4 sm:top-20 sm:right-6 z-[99999] flex items-center gap-2.5 rounded-full border border-slate-700 bg-[#0F172A]/95 px-4 py-2 text-xs font-bold text-white shadow-2xl backdrop-blur-xl ring-1 ring-emerald-500/20"
          >
            <span className="size-2 rounded-full bg-[#BEF264] animate-ping" />
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
