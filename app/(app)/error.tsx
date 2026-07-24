"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Error boundary untuk area terproteksi.
 *
 * Ada alasan konkret file ini penting: kalau sebuah halaman melempar error saat
 * dirender sebagai tujuan `redirect()` dari Server Action (mis. setelah login),
 * navigasi di client gagal diam-diam — user mengira tombolnya rusak. Boundary
 * ini memastikan kegagalan selalu terlihat dan bisa dibaca.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] render gagal:", error);
  }, [error]);

  const looksLikeDbProblem = /ENOTFOUND|ECONNREFUSED|Failed query|getaddrinfo|does not exist/i.test(
    error.message,
  );

  return (
    <div className="mx-auto flex max-w-reading flex-col items-start gap-6 py-16">
      <div
        aria-hidden
        className="flex size-14 items-center justify-center rounded-2xl bg-danger-soft text-h2 text-danger"
      >
        !
      </div>

      <h1 className="text-h1">Halaman ini gagal dimuat</h1>

      {looksLikeDbProblem ? (
        <div className="text-small">
          <p>Sepertinya aplikasi tidak bisa menghubungi database.</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              Pastikan <code>DATABASE_URL</code> di <code>.env.local</code>{" "}
              memakai host <strong>connection pooler</strong> Supabase
              (<code>*.pooler.supabase.com</code>), bukan{" "}
              <code>db.&lt;ref&gt;.supabase.co</code> yang sudah tidak resolve.
            </li>
            <li>
              Pastikan migrasi sudah dijalankan: <code>npm run db:migrate</code>.
            </li>
          </ul>
        </div>
      ) : (
        <p className="text-small text-muted-foreground">
          Terjadi kesalahan tak terduga saat merender halaman.
        </p>
      )}

      <pre className="max-h-48 w-full overflow-auto rounded-xl border border-border bg-surface-sunken p-4 font-mono text-tiny whitespace-pre-wrap">
        {error.message}
        {error.digest ? `\n\ndigest: ${error.digest}` : ""}
      </pre>

      <Button onClick={reset}>Coba lagi</Button>
    </div>
  );
}
