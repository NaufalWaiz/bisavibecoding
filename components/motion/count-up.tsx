"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Angka yang menghitung naik saat pertama terlihat.
 *
 * Dipakai untuk metrik (jumlah project, persentase keberhasilan) supaya papan
 * statistik terasa hidup, bukan sekadar angka mati yang dicetak.
 */
export function CountUp({
  value,
  suffix = "",
  duration = 900,
  className,
}: {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    )?.matches;
    if (reduced || typeof IntersectionObserver === "undefined") {
      setDisplay(value);
      return;
    }

    let frame = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();

        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          // easeOutCubic — cepat di awal lalu melandai.
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(Math.round(value * eased));
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.3 },
    );

    observer.observe(node);

    // Jaring pengaman: angka yang tersangkut di 0 lebih buruk daripada
    // kehilangan animasinya. Kalau observer tak pernah menyala, tampilkan.
    const failsafe = window.setTimeout(() => setDisplay(value), 1500);

    return () => {
      observer.disconnect();
      window.clearTimeout(failsafe);
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {display}
      {suffix}
    </span>
  );
}
