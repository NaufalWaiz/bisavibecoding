"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Munculkan konten saat masuk viewport, bukan hanya saat halaman dimuat.
 *
 * Animasi on-load saja membuat halaman panjang terasa kaku: semua yang di
 * bawah lipatan sudah "selesai" beranimasi sebelum sempat dilihat. Dengan
 * IntersectionObserver, gerakannya menemani scroll.
 *
 * Menghormati `prefers-reduced-motion` lewat CSS di globals.css.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  /** Urutan tampil (dikali 70ms), untuk efek berurutan dalam satu grup. */
  delay?: number;
  as?: "div" | "li" | "section" | "article";
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Kalau IntersectionObserver tak tersedia, tampilkan langsung.
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    observer.observe(node);

    /*
     * Jaring pengaman: konten TIDAK BOLEH tersangkut tak terlihat kalau
     * observer-nya tidak pernah menyala (viewport aneh, capture otomatis,
     * atau bug browser). Setelah 1,5 detik, tampilkan apa pun keadaannya.
     */
    const failsafe = window.setTimeout(() => setShown(true), 1500);

    return () => {
      observer.disconnect();
      window.clearTimeout(failsafe);
    };
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={cn("reveal", shown && "is-visible", className)}
      style={{ "--stagger": delay } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
