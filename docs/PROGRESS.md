# PROGRESS — bisavibecoding

Status per 22 Juli 2026. **T0.1 → T3.4 selesai semua** (16/16 task di
`docs/TASKS.md` bertanda `[x]`).

---

## 0. Perbaikan bug login (setelah setup Supabase asli)

**Gejala**: klik "Masuk" tidak melakukan apa-apa, tetap di halaman login, tanpa
pesan error.

**Penyebab**: dua hal bertumpuk, dan yang kedua menyembunyikan yang pertama.

1. `DATABASE_URL` di `.env.local` memakai host langsung
   `db.<ref>.supabase.co:5432` yang **sudah tidak resolve** (`ENOTFOUND`).
   Migrasi juga belum pernah dijalankan, jadi tabelnya belum ada.
2. Login sendiri **berhasil** dan cookie sesi tersimpan. Tapi
   `redirect('/projects')` dari Server Action membuat Next merender `/projects`
   sebagai bagian dari respons aksi; halaman itu menyentuh DB, gagal, dan
   navigasi client dibatalkan **tanpa pesan** — sehingga terlihat seperti tombol
   yang tidak berfungsi.

**Perbaikan**:
- `.env.local` → `DATABASE_URL` memakai transaction pooler
  (`*.pooler.supabase.com:6543`), plus `MIGRATION_DATABASE_URL` (session pooler,
  port 5432) untuk DDL. `drizzle.config.ts` memakai yang kedua kalau tersedia.
- `npm run db:migrate` dijalankan. Terverifikasi: 7 tabel ada, RLS aktif di
  semuanya, 9 policy terpasang, trigger `on_auth_user_created` ada.
- Ditambah `app/(app)/error.tsx` supaya kegagalan render tidak lagi diam, dan
  error `ensureProfile` di `app/(auth)/actions.ts` tidak lagi ditelan.

**Terverifikasi setelah perbaikan**: sign-in → cookie sesi tersimpan →
`ensureProfile` "ok" → `GET /projects` **200** (merender "Belum ada project").

---

## 0b. Perbaikan error LimitRouter + `ECONNRESET` DB

**Gejala**: `getaddrinfo ENOTFOUND api.limitrouter.com` saat generasi, dan
`read ECONNRESET` pada query `projects`.

**Penyebab & perbaikan**:

1. **Host gateway salah.** `api.limitrouter.com` **tidak ada** (NXDOMAIN).
   Endpoint OpenAI-compatible yang benar: `https://limitrouter.com/v1`
   (terverifikasi lewat `GET /v1/models`).
2. **Slug model tidak ada.** `claude-haiku-4-5` dan `claude-opus-4-8` ditolak
   dengan `model_not_found`. Gateway ini hanya menyediakan `claude-sonnet-4.5`.
   Kedua tier sekarang menunjuk slug itu.
3. **`ECONNRESET` DB.** Transaction pooler Supabase memutus koneksi yang
   menganggur, sementara postgres.js (default) memegang socket selamanya →
   query berikutnya menabrak socket mati. `lib/db/index.ts` kini memakai
   `idle_timeout: 20`, `max_lifetime: 30 menit`, `max: 10`, `connect_timeout: 15`.
4. **Kegagalan LLM tak terlihat.** AI SDK **tidak** melempar error ke
   `textStream` — stream hanya berakhir kosong dan alasannya dikirim ke
   `onError`. Akibatnya semua kegagalan tampak seperti balasan kosong.
   `lib/ai/index.ts` sekarang menangkap `onError`, menerjemahkannya lewat
   `describeAiError()`, dan mengalirkannya ke client memakai marker di
   `lib/ai/stream-error.ts`. Ketiga client stream memeriksa marker itu.

---

## 0c. Pemilihan model & parser JSON toleran

**Konteks**: seluruh model Claude & GPT di LimitRouter menolak dengan
`model_requires_topup` (minimum Rp20.000). Dengan saldo kecil, katalog terbuka
jadi 45 model dan sebagian besar bisa dipakai.

**Model yang dipilih** (diuji satu per satu):
- `AI_MODEL_DEFAULT=gemini-3.6-flash`
- `AI_MODEL_PREMIUM=gemini-3.1-pro`

Alasan: keduanya jalan dengan saldo kecil, streaming lancar, dan **tidak
membocorkan chain-of-thought** ke isi jawaban. Model yang sengaja dihindari
karena menulis proses berpikirnya ke `content` — dan itu akan masuk ke PRD:
`glm-5.1`, `glm-5.2`, `glm-5.2-fast`, `qwen3.7-plus`, `kimi-k2.7-code-fast`,
`deepseek-v4-flash`, `deepseek-v4-pro`. `gpt-oss-120b`, `minimax-m3`, dan
`mimo-v2.5-pro` mengembalikan `content` kosong.
Alternatif bersih lain kalau perlu: `grok-4.5`, `grok-4.3`, `deepseek-v3.2`,
`gemma-4-31B-it`, `qwen3-coder-next`, `composer-2.5-fast`.

**Parser JSON toleran**: gateway ini **tidak menghormati**
`response_format: json_object` — gemini dan grok tetap membungkus JSON dalam
fence ```json. Karena `generateObject` mengandalkan itu, `generateJson()` di
`lib/ai/index.ts` kini memakai `generateText` + `extractJson()` sendiri yang
menerima JSON murni, ber-fence, atau didahului kalimat pengantar.

**Terverifikasi end-to-end lewat route asli**:
`POST /api/ai/clarify` → 3 pertanyaan klarifikasi bersih ·
`POST /api/ai/prd` → PRD 4.273 byte berstruktur benar ·
`POST /api/ai/tasks` → **8 task** tersimpan, `final_prompt` 1.300–1.800 karakter
dan berdiri sendiri, `context_slice` terisi, `source_document_version=1`,
`is_stale=false`, 0 peringatan konsistensi, baris `generations` tercatat.

---

## 1. Verifikasi yang sudah dijalankan

Dijalankan ulang setelah tiap task:

| Perintah | Hasil |
|---|---|
| `npm run typecheck` (`tsc --noEmit`, strict) | lulus, 0 error |
| `npm run lint` | bersih, 0 warning |
| `npm run build` | sukses, 13 route ter-build |
| `npm run dev` + smoke HTTP | `/` 200 · `/login` 200 · `/projects` 307 → login |
| `npx drizzle-kit generate` | 2 migrasi, tanpa error |

Uji logika terisolasi (Node type-stripping, dijalankan sekali lalu dihapus):
- `taskListSchema` menolak task tak lengkap, menerima yang lengkap.
- `parseTaskListWithRetry` retry tepat 1x lalu melempar `TaskValidationError`.
- `checkTaskListConsistency` mengenali plural (`projects` ≈ `Project`) dan
  menandai entity asing (`Invoice`).
- SQL stale detection yang dihasilkan Drizzle persis
  `tasks.source_document_version < documents.version`.

**Yang BELUM bisa diverifikasi end-to-end**: apa pun yang butuh Supabase asli
atau LimitRouter asli (lihat §4).

---

## 2. File penting yang dibuat

### Lapisan AI — `lib/ai/` (satu-satunya pintu ke LLM)
| File | Isi |
|---|---|
| `index.ts` | Klien LimitRouter (`createOpenAI` + `baseURL`), `streamText()`, `generateStructured()`, `generateJson()`, pelaporan token |
| `models.ts` | `resolveModel(tier)` — `default`/`premium` → slug dari env |
| `prompts/idea-clarify.ts` | Tahap 1: ide mentah → 2–3 pertanyaan tajam |
| `prompts/prd.ts` | Tahap 2: transkrip → PRD markdown berstruktur tetap |
| `prompts/tasks.ts` | Tahap 3: PRD terkunci → task (mendukung mode regenerate stale) |
| `prompts/rules-file.ts` | Tahap 4: PRD + stack → `CLAUDE.md` / `.cursorrules` |
| `schemas/tasks.ts` | `taskListSchema` + `parseTaskListWithRetry()` |
| `consistency.ts` | Konsistensi checker deterministik (T3.3) |

### Lapisan data — `lib/db/`
`schema.ts` (7 tabel sesuai DATABASE.md + 2 kolom tambahan, lihat D-005),
`index.ts` (koneksi Drizzle), `migrations/0000_*.sql` (tabel & indeks),
`migrations/0001_rls_and_auth.sql` (FK ke `auth.users`, trigger profile, RLS +
policy), serta `queries/`: `profiles.ts`, `projects.ts`, `documents.ts`,
`tasks.ts`, `task_feedback.ts`, `generations.ts`.

### API — `app/api/`
`ai/clarify` (stream), `ai/prd` (POST stream + PUT simpan), `ai/tasks`
(terstruktur, `mode: all | stale`), `ai/rules` (stream), `_lib/route-helpers.ts`
(guard sesi + kepemilikan project, dipakai semua route).

### UI — `app/`
`(auth)/login`, `(auth)/register` + server actions; `(app)/layout.tsx`
(terproteksi); `(app)/projects` (daftar, dialog buat, hapus);
`(app)/projects/[id]` dengan 4 tab: **Ide** (chat streaming), **PRD** (generate /
edit / lock), **Task** (daftar, copy prompt, status, badge stale & konsistensi,
feedback, ringkasan %), **Ekspor** (`CLAUDE.md`, `.cursorrules`,
`prompt-task.md`). Plus `middleware.ts` untuk refresh sesi & proteksi route.

---

## 3. Asumsi yang diambil

Semua tercatat lengkap di **`docs/DECISIONS.md`** (D-001 … D-014). Yang paling
berdampak:

- **D-001** Next.js dipin ke 15.x (create-next-app sekarang default ke 16).
- **D-005** Dua kolom di luar DATABASE.md: `projects.conversation` (transkrip
  intake, untuk T1.3) dan `tasks.consistency_warnings` (untuk T3.3). Semua tabel
  & kolom di DATABASE.md tetap ada persis — ini penambahan, bukan perubahan.
- **D-008** Query Drizzle memakai role owner sehingga **tidak** terikat RLS.
  Karena itu tiap fungsi di `lib/db/queries/*` menyaring `userId` secara
  eksplisit; RLS tetap aktif sebagai lapis kedua.
- **D-011** `documents.version` naik saat **lock ulang**, bukan tiap simpan —
  kalau tidak, semua task akan selalu stale dan fitur pembeda jadi tak berarti.
- **D-012** Konsistensi checker deterministik (tanpa LLM kedua).
- **D-014** Feedback disimpan sebagai riwayat; metrik memakai penilaian terakhir.

---

## 4. Yang perlu kamu periksa manual

Aplikasi build & jalan, tapi **belum pernah terhubung ke Supabase atau
LimitRouter sungguhan**. Berikut urutan yang perlu kamu lakukan.

### a. Isi `.env.local`
Saat ini `.env.local` berisi **placeholder** supaya build/dev tidak gagal. Ganti
semuanya dengan nilai asli (struktur & keterangan ada di `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL,
LIMITROUTER_API_KEY, LIMITROUTER_BASE_URL,
AI_MODEL_DEFAULT, AI_MODEL_PREMIUM
```

Catatan: `DATABASE_URL` **tidak** disebut di TASKS.md tapi wajib ada — Drizzle
mengakses Postgres langsung, bukan lewat REST Supabase (D-004). Pakai
connection pooler (port 6543).

### b. Setup Supabase
1. Buat project Supabase, ambil URL + kedua key + connection string.
2. Jalankan migrasi: `npm run db:migrate`.
   Migrasi `0001` mengasumsikan schema `auth` Supabase sudah ada (ia membuat FK
   ke `auth.users` dan trigger di atasnya) — jadi **jalankan di Supabase, bukan
   Postgres polos**.
3. Di dashboard → Authentication → Providers, pastikan **Email** aktif.
4. **Keputusan yang harus kamu ambil**: kalau konfirmasi email diaktifkan, alur
   register akan menampilkan pesan "cek email dulu" dan tidak langsung masuk.
   Untuk uji internal, lebih cepat mematikannya dulu.
5. Verifikasi trigger jalan: daftar satu user, lalu cek tabel `profiles` harus
   otomatis terisi (`plan='free'`, `credits=50`).

### c. Setup LimitRouter
1. Pastikan `LIMITROUTER_BASE_URL` menunjuk ke endpoint OpenAI-compatible
   (biasanya berakhiran `/v1`).
2. Isi `AI_MODEL_DEFAULT` dan `AI_MODEL_PREMIUM` dengan **slug persis** seperti
   yang dikenali LimitRouter. Nilai di `.env.example` hanya contoh.
3. `AI_MODEL_PREMIUM` dipakai untuk generasi PRD & task (kualitas paling
   menentukan di sana); `AI_MODEL_DEFAULT` untuk klarifikasi ide & rules-file.
   Kalau mau semua premium, samakan saja kedua slug.

### d. Uji alur ujung-ke-ujung (setelah a–c beres)
1. Daftar → buat project + pilih stack.
2. Tab **Ide**: kirim ide, pastikan pertanyaan mengalir token demi token.
3. Tab **PRD**: Generate → Edit → Simpan → **Lock** (harus jadi versi 1).
4. Tab **Task**: Generate task. Periksa `final_prompt` — inilah metrik
   sesungguhnya: **apakah bisa dipahami tanpa membuka PRD?**
5. Kembali ke PRD, edit sedikit, Simpan, **Lock lagi** → versi jadi 2 →
   tab Task harus menampilkan badge **stale**.
6. Tekan **Regenerate stale** → hanya task stale yang berubah, sisanya utuh, dan
   tidak ada lagi yang stale.
7. Tab **Ekspor**: generate `CLAUDE.md` & `.cursorrules`, coba Download.
8. Cek tabel `generations` di Supabase — harus ada satu baris per generasi.

### e. Hal kecil yang mungkin perlu penyesuaian
- **Timeout Vercel**: route `ai/tasks` di-set `maxDuration = 300`. Plan Hobby
  Vercel membatasi lebih pendek; kalau generate task timeout di produksi,
  pertimbangkan memecahnya per-batch.
- **Biaya di `generations.cost`** masih `0` — MVP baru mencatat token & slug
  model, belum ada tabel harga (sesuai keputusan "tidak ada payment di MVP").
- `docs/DECISIONS.md` layak kamu baca sekali penuh sebelum lanjut ke fase
  berikutnya (codebase-aware), khususnya D-005 dan D-008.
