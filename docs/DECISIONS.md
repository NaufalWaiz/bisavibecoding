# DECISIONS — asumsi yang diambil saat implementasi

Catatan keputusan/asumsi yang diambil saat mengerjakan `docs/TASKS.md` ketika
spesifikasi ambigu. Setiap entri: konteks → keputusan → alasan.

---

## D-001 — Versi Next.js dipin ke 15.x

**Task**: T0.1
**Konteks**: `create-next-app@latest` kini menghasilkan Next.js 16.
**Keputusan**: Downgrade eksplisit ke `next@^15.5` + `eslint-config-next@^15.5`,
sesuai CLAUDE.md §2 ("Next.js 15 (App Router)").
**Alasan**: CLAUDE.md melarang ganti stack tanpa alasan kuat. Template Next 16
menghasilkan `eslint.config.mjs` yang tidak kompatibel dengan config v15, jadi
file itu ditulis ulang memakai `FlatCompat` + `@eslint/eslintrc`.

## D-002 — Tailwind v4 + shadcn/ui preset "nova" (base radix)

**Task**: T0.1
**Konteks**: CLI shadcn terbaru mewajibkan pilih preset & component base.
**Keputusan**: `--base radix --preset nova --css-variables`.
**Alasan**: Radix adalah base klasik shadcn/ui yang dirujuk CLAUDE.md; CSS
variables dipakai agar tema mudah diubah.

## D-003 — Driver Postgres: `postgres` (postgres.js)

**Task**: T0.1 / T0.3
**Konteks**: Drizzle butuh driver; Supabase menyediakan connection string.
**Keputusan**: Pakai `postgres` (postgres.js) dengan `drizzle-orm/postgres-js`.
**Alasan**: Ringan, didukung penuh Drizzle, jalan di serverless Vercel dengan
`prepare: false` (kompatibel dengan connection pooler Supabase).

## D-004 — `DATABASE_URL` ditambahkan ke daftar env

**Task**: T0.2
**Konteks**: TASKS.md T0.2 tidak menyebut connection string, tapi Drizzle butuh
akses Postgres langsung (bukan lewat REST Supabase).
**Keputusan**: Tambah `DATABASE_URL` di `.env.example` (connection pooler, port
6543).
**Alasan**: Tanpa ini `drizzle-kit` dan `lib/db` tidak bisa jalan sama sekali.

## D-005 — Dua kolom tambahan di luar DATABASE.md

**Task**: T0.3
**Konteks**: DATABASE.md tidak menyediakan tempat untuk (a) transkrip percakapan
intake (T1.3) dan (b) peringatan konsistensi non-blocking (T3.3).
**Keputusan**:
- `projects.conversation` (jsonb, default `[]`) — transkrip ide ↔ klarifikasi.
- `tasks.consistency_warnings` (jsonb, default `[]`) — hasil checker T3.3.
**Alasan**: Keduanya wajib untuk acceptance criteria task berikutnya. Semua
tabel & kolom di DATABASE.md tetap ada persis; ini penambahan, bukan perubahan.
Dipilih jsonb agar sejalan dengan gaya skema yang sudah ada.

## D-006 — Profil dibuat lewat trigger Postgres, bukan kode aplikasi

**Task**: T0.3 / T0.4
**Konteks**: T0.4 mensyaratkan baris `profiles` otomatis terbuat saat daftar.
**Keputusan**: Trigger `on_auth_user_created` di `auth.users` memanggil
`public.handle_new_user()` (SECURITY DEFINER) yang meng-insert `profiles`
dengan `plan='free'`, `credits=50`. Kode aplikasi tetap punya `ensureProfile()`
sebagai jaring pengaman kalau trigger belum terpasang.
**Alasan**: Trigger DB jalan untuk semua jalur pendaftaran (termasuk OAuth &
undangan dari dashboard), tidak bisa dilewati client.

## D-007 — RLS memakai helper `SECURITY DEFINER`

**Task**: T0.3
**Konteks**: Policy untuk tabel anak (documents/tasks/…) perlu join ke
`projects`, dan sub-select di dalam policy bisa memicu rekursi RLS.
**Keputusan**: Buat fungsi `owns_project()`, `owns_document()`, `owns_task()`
bertipe `STABLE SECURITY DEFINER` dengan `search_path = public`, lalu policy
memanggilnya.
**Alasan**: Menghindari rekursi policy dan membuat aturan kepemilikan hidup di
satu tempat. `generations` sengaja hanya punya policy SELECT — penulisannya
dilakukan server lewat koneksi Drizzle.

## D-008 — Kepemilikan tetap dicek di kode server, bukan hanya RLS

**Task**: T0.3+
**Konteks**: `lib/db` terhubung ke Postgres sebagai role `postgres` (bukan
`authenticated`), jadi RLS tidak berlaku untuk query Drizzle.
**Keputusan**: Setiap fungsi di `lib/db/queries/*` menerima `userId` dan
menyaring kepemilikan secara eksplisit di WHERE. RLS tetap diaktifkan sebagai
lapis pertahanan kedua (mis. kalau nanti ada akses langsung dari client
Supabase).
**Alasan**: Defense in depth; kalau hanya mengandalkan salah satu, ada celah.

## D-009 — Streaming dikirim sebagai `text/plain`, bukan protokol UI AI SDK

**Task**: T1.2 / T1.3
**Konteks**: AI SDK menyediakan `toUIMessageStreamResponse()` yang berpasangan
dengan hook `useChat`.
**Keputusan**: Route memakai `toTextStreamResponse()`; client membaca lewat
`fetch` + `TextDecoderStream`.
**Alasan**: Percakapan intake bukan chat umum — transkrip disimpan di
`projects.conversation`, dan PRD/rules-file juga butuh streaming teks polos.
Satu mekanisme untuk semua lebih sederhana dan tidak mengikat bentuk data ke
protokol SDK.

## D-010 — `generateJson()` (mode `no-schema`) + validasi Zod di pemanggil

**Task**: T2.1 / T2.2
**Konteks**: `generateStructured()` sudah punya retry internal, tapi T2.1
mensyaratkan helper parse+validasi tersendiri yang retry 1x.
**Keputusan**: `lib/ai/index.ts` menambah `generateJson()` yang mengembalikan
JSON mentah; `parseTaskListWithRetry()` di `lib/ai/schemas/tasks.ts` yang
memvalidasi dan menyuntikkan pesan error Zod ke percobaan kedua.
**Alasan**: Menghindari dua lapis retry bertumpuk, dan menaruh pengetahuan
tentang bentuk task di schema — bukan di lapisan provider.

## D-011 — Versi dokumen naik saat LOCK, bukan saat simpan

**Task**: T1.4
**Konteks**: DATABASE.md: "documents.version naik tiap kali dokumen di-lock
ulang setelah diedit".
**Keputusan**: `lockDocument()` menaikkan versi hanya kalau sudah ada baris di
`document_versions` (artinya dokumen pernah dikunci). Lock pertama tetap versi 1.
Menyimpan/mengedit mengembalikan status ke `draft` tanpa menyentuh versi.
**Alasan**: Kalau versi naik tiap simpan, hampir semua task jadi stale terus dan
fitur stale detection kehilangan artinya.

## D-012 — Konsistensi checker deterministik (tanpa LLM)

**Task**: T3.3
**Konteks**: Perlu mendeteksi task yang menyebut entity di luar PRD.
**Keputusan**: `lib/ai/consistency.ts` membaca bagian "## 5. Entity & data" PRD
(format dijamin prompt `prd.ts`), lalu membandingkan dengan
`context_slice.entities` dengan normalisasi case/plural/underscore.
**Alasan**: Murah, cepat, dan hasilnya bisa dipercaya. Memanggil LLM lagi untuk
memeriksa LLM cenderung menambah derau. Peringatan disimpan di
`tasks.consistency_warnings` dan bersifat non-blocking.

## D-013 — Tab "Ekspor" sebagai halaman tersendiri

**Task**: T2.4
**Konteks**: TASKS.md menyebut "UI export" tanpa menentukan lokasinya.
**Keputusan**: `app/(app)/projects/[id]/export/` dengan tab baru di nav project.
Selain `CLAUDE.md` & `.cursorrules`, halaman ini juga mengekspor seluruh
`final_prompt` sebagai satu berkas `prompt-task.md` (PRD §5.1 G).
**Alasan**: Ekspor adalah aksi tingkat project, bukan bagian dari alur PRD atau
daftar task.

## D-014 — Feedback disimpan sebagai riwayat; yang dihitung yang terakhir

**Task**: T3.4
**Konteks**: User bisa berubah penilaian setelah mencoba ulang prompt.
**Keputusan**: Tiap penilaian jadi baris baru di `task_feedback`. Metrik
memakai penilaian TERAKHIR per task (`getLatestFeedbackByTask`).
**Alasan**: Riwayat penilaian adalah data belajar yang berharga; menimpanya
akan menghilangkan sinyal "prompt ini awalnya gagal lalu berhasil".

## D-015 — `MIGRATION_DATABASE_URL` terpisah untuk DDL

**Task**: perbaikan bug login
**Konteks**: Supabase punya dua pooler. Transaction pooler (6543) cocok untuk
runtime serverless tapi tidak untuk DDL; session pooler (5432) sebaliknya.
Host langsung `db.<ref>.supabase.co` sudah tidak resolve sama sekali.
**Keputusan**: `drizzle.config.ts` memakai `MIGRATION_DATABASE_URL` kalau ada,
jatuh ke `DATABASE_URL` kalau tidak. Runtime tetap memakai `DATABASE_URL`
(transaction pooler).
**Alasan**: Satu URL tidak bisa melayani keduanya dengan benar, dan kegagalannya
tidak kelihatan sampai halaman pertama yang menyentuh DB dirender.

## D-016 — Error boundary di area terproteksi

**Task**: perbaikan bug login
**Konteks**: Ketika halaman tujuan `redirect()` dari Server Action gagal render,
Next membatalkan navigasi di client **tanpa pesan apa pun** — user mengira
tombolnya rusak. Ini persis gejala bug login yang dilaporkan.
**Keputusan**: Tambah `app/(app)/error.tsx`, dan hentikan penelanan diam-diam
error `ensureProfile` di `app/(auth)/actions.ts` (sekarang di-log dengan
petunjuk perbaikan).
**Alasan**: Kegagalan konfigurasi harus terlihat di tempat kejadian. Boundary
ini juga mengenali error khas DB dan langsung menyarankan perbaikannya.

## D-017 — Error stream dilaporkan lewat marker dalam body

**Task**: perbaikan error LimitRouter
**Konteks**: Route AI mengirim status 200 sebelum token pertama tiba. Lebih
buruk lagi, AI SDK **tidak melempar** error ke `textStream` — stream hanya
berakhir kosong dan alasannya dikirim ke callback `onError`. Jadi setiap
kegagalan (slug salah, kredit habis, host salah) tampak sebagai balasan kosong.
**Keputusan**: `streamText()` di `lib/ai/index.ts` menangkap `onError`,
menerjemahkan penyebabnya dengan `describeAiError()`, lalu menuliskannya ke body
setelah marker `\n\n[[ARSITEK_STREAM_ERROR]] `. Client memisahkannya dengan
`splitStreamError()` dari `lib/ai/stream-error.ts`. Stream yang berakhir tanpa
teks sama sekali juga diperlakukan sebagai kegagalan.
**Alasan**: Status HTTP tidak bisa lagi diubah setelah header terkirim, jadi
kanal satu-satunya adalah body. Marker memakai ASCII biasa (bukan karakter
kontrol) supaya aman melewati proxy dan terbaca saat debugging dengan curl.

## D-018 — Opsi resiliensi koneksi postgres.js

**Task**: perbaikan `ECONNRESET`
**Konteks**: Transaction pooler Supabase memutus koneksi menganggur; postgres.js
secara default menahan socket selamanya, sehingga query berikutnya menabrak
socket mati.
**Keputusan**: `idle_timeout: 20`, `max_lifetime: 30 menit`, `max: 10`,
`connect_timeout: 15` di `lib/db/index.ts`.
**Alasan**: Mendaur ulang koneksi lebih dulu daripada diputus pooler. Ini
kelihatan seperti error acak karena hanya muncul setelah aplikasi menganggur.

## D-019 — `generateText` + parser JSON sendiri, bukan `generateObject`

**Task**: pemilihan model
**Konteks**: `generateObject` mengandalkan gateway menghormati
`response_format: json_object`. LimitRouter tidak — gemini dan grok tetap
membungkus JSON dalam fence ```json, sehingga parsing internal AI SDK gagal.
**Keputusan**: `generateJson()` memakai `generateText` lalu `extractJson()`
yang mencoba berurutan: isi fence → teks apa adanya → blok `{...}` terluar.
**Alasan**: Membuat lapisan task tidak bergantung pada kebiasaan satu model.
Mengganti slug model tidak boleh sampai merusak generasi task.

## D-020 — Model dipilih berdasarkan kebersihan output, bukan sekadar harga

**Task**: pemilihan model
**Konteks**: Banyak model murah di gateway ini menuliskan chain-of-thought ke
`content` (`glm-*`, `qwen3.7-plus`, `kimi-*`, `deepseek-v4-*`), dan sebagian
mengembalikan `content` kosong (`gpt-oss-120b`, `minimax-m3`, `mimo-v2.5-pro`).
**Keputusan**: `gemini-3.6-flash` (default) dan `gemini-3.1-pro` (premium).
**Alasan**: Output tahap ini masuk langsung ke PRD dan `final_prompt` yang
dibaca AI coding agent. Proses berpikir yang bocor akan mencemari keduanya —
kerugiannya jauh lebih besar daripada selisih biaya.
