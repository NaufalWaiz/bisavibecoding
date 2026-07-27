# ARCHITECTURE (SDD) — Arsitek

Versi: 1.0 (MVP)

## 1. Gambaran umum

Arsitek adalah aplikasi Next.js (App Router) monolitik yang di-deploy ke Vercel.
Beban berat ada di pemanggilan LLM (di server, streaming), bukan di komputasi
server sendiri. Postgres (Supabase) menyimpan artefak dan relasinya — relasi ini
adalah fondasi fitur integritas konteks.

```
[Browser]
   │  (UI: Next.js Server + Client Components, Tailwind + shadcn)
   ▼
[Next.js Route Handlers  /app/api/ai/*]
   │  streaming (Vercel AI SDK)
   ▼
[lib/ai]  ── pilih slug model ── validasi Zod
   │  │
   │  └──▶ HTTPS (LIMITROUTER_BASE_URL) ──▶ [LimitRouter gateway (OpenAI-compatible)]
   │                                             └─ rute ke model (Anthropic / OpenAI / dst)
   ▼
[lib/db]  ── Drizzle ── [Supabase Postgres]
                              │
                          [Supabase Auth]
```

## 2. Keputusan teknis & alasan

| Keputusan | Pilihan | Alasan |
|---|---|---|
| Framework | Next.js 15 App Router | Full-stack satu repo, streaming native, mudah di-deploy Vercel, cocok di-vibe-code |
| ORM | Drizzle | Type-safe, migrasi jelas, output mudah dibaca AI agent |
| DB | Supabase Postgres | Relasional (butuh untuk relasi artefak), plus Auth & RLS gratis |
| LLM SDK | Vercel AI SDK (`@ai-sdk/openai`) | Streaming seragam; klien OpenAI-compatible bisa diarahkan ke `baseURL` mana pun |
| LLM provider | LimitRouter (OpenAI-compatible) | Satu gateway, satu API key untuk banyak model; ganti model cukup ganti slug, tanpa ganti SDK provider |
| Pemilihan model | Slug via env (`AI_MODEL_DEFAULT` / `AI_MODEL_PREMIUM`) | Multi-model jadi konfigurasi, bukan cabang kode; mudah tuning biaya vs kualitas |
| Validasi | Zod | Menjamin output LLM terstruktur sebelum masuk DB |
| ERD render | Mermaid.js | LLM jago hasilkan sintaks, render di client gratis |

## 3. Lapisan aplikasi

### 3.1 Lapisan AI (`lib/ai/`)
Satu pintu untuk semua interaksi LLM. Integrasi LimitRouter **hanya** hidup di
sini — route/komponen tidak pernah tahu provider apa yang dipakai.
- `index.ts`: membuat satu klien OpenAI-compatible (`createOpenAI({ apiKey:
  LIMITROUTER_API_KEY, baseURL: LIMITROUTER_BASE_URL })`) yang menunjuk ke
  LimitRouter. Ekspor fungsi seperti `generateStructured(schema, prompt, tier)`
  dan `streamText(prompt, tier)`. `tier` (`'default' | 'premium'`) dipetakan ke
  slug lewat `models.ts` — bukan berganti SDK provider.
- `models.ts`: sumber tunggal slug model. Membaca `AI_MODEL_DEFAULT` dan
  `AI_MODEL_PREMIUM` dari env dan mengekspornya sebagai konstanta bertipe, plus
  helper `resolveModel(tier)`.
- `prompts/`: template prompt per tahap. Satu file per tahap agar bisa diperbaiki
  independen: `idea-clarify.ts`, `prd.ts`, `tasks.ts`, `rules-file.ts`.
- `schemas/`: Zod schema untuk output terstruktur (mis. `taskListSchema`).

**Prinsip**: rantai prompt bertingkat, bukan satu prompt raksasa. Output tahap
sebelumnya menjadi input tahap berikutnya. Prompt task menerima PRD + stack.

### 3.2 Lapisan data (`lib/db/`)
- `schema.ts`: definisi Drizzle (lihat DATABASE.md).
- `queries/`: fungsi query per entitas (`projects.ts`, `documents.ts`,
  `tasks.ts`). Tidak ada query mentah tersebar di route/komponen.

### 3.3 Lapisan API (`app/api/`)
- Semua pemanggilan LLM lewat route handler (server), streaming ke client.
- Tidak pernah mengekspos `LIMITROUTER_API_KEY` ke client.

## 4. Manajemen konteks selektif (titik tersulit)

Saat generate task, JANGAN suntik seluruh PRD + semua entity mentah ke tiap task.
Sebaliknya:
1. PRD di-parse menjadi bagian-bagian (fitur, entity, aturan).
2. Untuk tiap task, ambil hanya slice yang relevan → simpan ke `tasks.context_slice`.
3. `final_prompt` dirakit dari slice itu, bukan dari PRD penuh.

Ini menekan biaya token dan meningkatkan akurasi. Rancang struktur "context slice"
sejak awal; ini yang membedakan tool matang dari tool mainan.

## 5. Integritas konteks (stale detection)

- `documents` punya kolom `version` (naik tiap kali di-lock ulang setelah edit).
- `tasks` menyimpan `source_document_id` dan `source_document_version`.
- Task dianggap **stale** jika `document.version > task.source_document_version`.
- UI menandai task stale dan menawarkan regenerate selektif.

## 6. Alur generasi (contoh: PRD → task)

1. Client memanggil `POST /api/ai/tasks` dengan `projectId`.
2. Server memuat PRD terkunci + stack dari DB.
3. Server merakit prompt dari `prompts/tasks.ts` + konteks.
4. LLM menghasilkan JSON; divalidasi `taskListSchema` (Zod). Gagal → retry 1x.
5. Task disimpan ke DB dengan `source_document_version` = versi PRD saat ini.
6. Biaya generasi dicatat ke tabel `generations`.

## 7. Keamanan

- Supabase Row-Level Security: user hanya bisa akses barisnya sendiri.
- Semua route handler memverifikasi sesi user sebelum operasi.
- `LIMITROUTER_API_KEY` hanya di server (env var), tidak pernah ke client.
  Karena semua trafik LLM lewat satu gateway, kunci ini satu-satunya kredensial
  model yang perlu dijaga.

## 8. Yang sengaja ditunda

- Payment: tabel `generations` + kolom `credits` disiapkan, integrasi gateway nanti.
- Codebase-aware: struktur `context_slice` sudah fleksibel (jsonb) agar nanti bisa
  memuat potongan kode nyata tanpa migrasi besar. Rancangannya di §9–§11.

---

## 9. Codebase-aware: cara repo masuk ke sistem (Fase 4)

Status: **rancangan**. Produk: PRD §9. Task: TASKS.md FASE 4.

### 9.1 Prinsip yang tidak boleh dilanggar

1. **Repo tidak pernah dikirim utuh ke LLM.** Yang dikirim adalah *digest*
   berukuran terbatas hasil pemindaian deterministik. Ini perpanjangan langsung
   dari §4 (manajemen konteks selektif): kalau menyuntik seluruh PRD saja sudah
   dianggap kesalahan, menyuntik seluruh repo jauh lebih buruk.
2. **Pemindaian deterministik dulu, LLM belakangan.** Struktur folder, stack,
   dan daftar model bisa dihitung dengan kode biasa. Menyerahkannya ke LLM
   berarti membayar token untuk sesuatu yang bisa pasti benar (lihat D-012).
3. **Semua tetap lewat `lib/ai/`** dengan output tervalidasi Zod.
4. **Ada batas keras di setiap tahap.** Repo user tidak terduga isinya; tanpa
   batas eksplisit, satu repo aneh bisa menghabiskan memori atau biaya.

### 9.2 Keputusan: ZIP upload vs koneksi GitHub

| Aspek | Unggah ZIP | Koneksi GitHub (OAuth) |
|---|---|---|
| Yang harus dibangun | 1 route upload + unzip | OAuth app, callback, simpan & refresh token, pemilih repo/branch, penanganan rate limit |
| Kredensial baru | tidak ada | client id/secret + token akses per user (harus dienkripsi, jadi target serangan) |
| Repo privat | jalan apa adanya | butuh scope `repo` — izin yang luas dan bikin user ragu |
| Repo non-GitHub (GitLab, Bitbucket, lokal, klien) | jalan | tidak |
| Segarkan snapshot | manual, unggah ulang | sekali klik / otomatis |
| Versi snapshot | waktu unggah | commit SHA — lebih presisi |
| Batas ukuran | body request (lihat §10.1) | tarball API, jauh lebih longgar |
| Beban privasi | user memilih sendiri apa yang di-zip | kita memegang token yang bisa membaca semua repo-nya |

**Pilihan v1: unggah ZIP.** Alasannya:

- **Membuktikan hipotesis dengan jalur terpendek.** Yang belum terbukti bukan
  "bisakah kita mengambil kode", tapi "apakah task yang sadar kode benar-benar
  menaikkan angka sekali-jalan-benar". OAuth tidak membantu menjawab itu sedikit
  pun, tapi menambah banyak permukaan gagal sebelum pertanyaannya terjawab.
- **Nol kredensial baru.** Menyimpan token GitHub berarti kita memegang kunci ke
  seluruh repo user. Itu tanggung jawab keamanan yang berat untuk fitur yang
  masih dalam tahap pembuktian.
- **Cakupannya justru lebih luas.** ZIP jalan untuk GitLab, Bitbucket, repo
  kantor, bahkan folder yang tidak ber-git sama sekali. Pengguna internal awal
  (PRD §3) tidak semuanya menaruh kode di GitHub publik.
- **Titik integrasinya sama.** Kedua jalur bertemu di satu kontrak internal:
  daftar file + isinya → `scanRepository()`. Menambah GitHub nanti berarti
  menulis satu adapter baru, bukan membongkar pipeline. Ini yang membuat
  keputusan ini murah untuk dibalik.

Konsekuensi yang diterima: user harus unggah ulang untuk menyegarkan, dan versi
snapshot tidak sepresisi commit SHA. Keduanya ditutupi stale detection (§11.3) —
user tetap diberi tahu kalau task-nya dibuat dari snapshot lama.

Rencana kalau v1 terbukti: tambah adapter GitHub yang mengunduh tarball dengan
token, sisa pipeline tidak berubah.

---

## 10. Pipeline ingest

```
[Browser] ZIP
   │  multipart POST
   ▼
[/api/codebase/ingest]
   │
   ├─ 1. unzip + filter        lib/codebase/archive.ts   (deterministik, berbatas)
   ├─ 2. scan                  lib/codebase/scan.ts      (deterministik)
   │        └─▶ CodebaseDigest (≤ ~40 KB)
   ├─ 3. ringkas               lib/ai/prompts/repo-map.ts (LLM, 1 panggilan, Zod)
   │        └─▶ Repo map (markdown) + CodebaseSummary (terstruktur)
   └─ 4. simpan                documents(type='codebase') + document_versions
```

### 10.1 Tahap 1 — Ekstraksi & filter (`lib/codebase/archive.ts`)

Berjalan sebelum apa pun yang mahal. Aturan buang, dari yang paling murah:

- **Direktori**: `node_modules`, `.git`, `.next`, `dist`, `build`, `out`,
  `coverage`, `vendor`, `target`, `.venv`, `__pycache__`, `.turbo`, `.cache`,
  `.vercel`.
- **Ekstensi biner/turunan**: gambar, font, audio/video, arsip, `.pdf`, `.exe`,
  `.wasm`, `.min.js`, `.map`, snapshot besar.
- **Lockfile**: keberadaannya dicatat (penentu package manager), isinya dibuang.
- **File > 256 KB**: dilewati, tapi path-nya tetap masuk indeks (kehadirannya
  informatif, isinya tidak).
- **Bukan teks**: dideteksi dari byte NUL di 8 KB pertama, bukan dari ekstensi
  saja — ekstensi bisa berbohong.

Batas keras (semua bisa dikonfigurasi di satu konstanta):

| Batas | Nilai v1 | Alasan |
|---|---|---|
| Ukuran ZIP | 4 MB | body request route handler; lihat catatan di bawah |
| Total hasil dekompresi | 60 MB | **penjaga zip bomb** |
| Rasio dekompresi | 100:1 | penjaga zip bomb kedua |
| Jumlah file dipindai | 5.000 | repo di atas ini tidak akan muat di digest |
| Ukuran file dibaca | 256 KB | file lebih besar hampir selalu generated |

**Catatan batas 4 MB**: platform serverless membatasi body request (Vercel
~4,5 MB). Repo sumber tanpa `node_modules` umumnya jauh di bawah itu, jadi v1
menerima batas ini dan menyampaikannya di UI **sebelum** user memilih file.
Kalau nanti terbukti mengganggu, jalur upgrade-nya sudah jelas: unggah langsung
ke Supabase Storage dengan signed URL (melewati batas body), server mengunduh
dari sana. Itu murni perubahan transport, tidak menyentuh tahap 2–4.

Keamanan: nama entri ZIP divalidasi terhadap **zip slip** (`../`, path absolut,
symlink) walaupun v1 tidak pernah menulis ke disk — memproses seluruhnya di
memori dengan batas di atas.

### 10.2 Tahap 2 — Pemindaian deterministik (`lib/codebase/scan.ts`)

Tanpa LLM. Menghasilkan `CodebaseDigest`:

- **`stack`** — dari bukti nyata: dependency di `package.json`, keberadaan
  `next.config.*`, `drizzle.config.*`, `tailwind.config.*`, lockfile, `tsconfig`.
  Dilaporkan sebagai `{ nilai, bukti }` supaya bisa diaudit, bukan tebakan telanjang.
- **`tree`** — struktur folder dengan kedalaman dibatasi (≈4 level) dan direktori
  padat diringkas jadi jumlah (`components/ui/ (23 file)`).
- **`files`** — indeks lengkap: `path`, `ext`, `bytes`, `loc`. Path saja murah;
  inilah yang membuat verifikasi path (§11.2) mungkin.
- **`conventions`** — pola penamaan file (kebab/camel/Pascal) per direktori,
  alias impor dari `tsconfig.paths`, rasio `"use client"`, konvensi nama test,
  gaya ekspor. Dilaporkan dengan tingkat keyakinan + contoh.
- **`models`** — entity dari kode nyata: tabel Drizzle (`pgTable("x", …)`),
  model Prisma, `CREATE TABLE` di migrasi SQL. Nama + field. **Ini bahan
  konsistensi checker versi kode** (§11.4).
- **`outlines`** — untuk file sumber penting: simbol yang diekspor + impor
  tingkat atas. v1 memakai regex, bukan AST penuh: murah, deterministik, dan
  cukup untuk menjawab "apakah helper ini sudah ada". Keterbatasannya diakui
  terbuka, bukan disembunyikan.
- **`entrypoints`** — `package.json` scripts, `middleware.ts`, route handler,
  file config.

Digest dipangkas ke **≤ ~40 KB** sebelum menyentuh LLM, dengan urutan prioritas:
manifest & model > konvensi > outline file penting > tree > sisa indeks path.
Yang terpangkas dicatat jumlahnya, dan jumlah itu ikut ditampilkan ke user —
konteks yang dibuang diam-diam adalah cara paling halus untuk berbohong.

### 10.3 Tahap 3 — Repo map (satu panggilan LLM)

`lib/ai/prompts/repo-map.ts` menerima **digest saja** (tidak pernah file mentah)
dan menghasilkan dua keluaran sekaligus, tervalidasi
`lib/ai/schemas/codebase.ts`:

1. **`repo_map`** (markdown) — dibaca manusia; disimpan di `documents.content`.
2. **`summary`** (terstruktur) — dinormalisasi untuk dipakai mesin; disimpan di
   `documents.metadata`.

Tugas LLM di sini sengaja sempit: **menarasikan dan mengelompokkan**, bukan
menyimpulkan fakta baru. Fakta (stack, model, path) sudah pasti dari tahap 2 dan
diteruskan apa adanya. Kalau LLM menyebut path yang tidak ada di indeks, path itu
dibuang saat validasi.

### 10.4 Tahap 4 — Penyimpanan & retensi

Yang **disimpan**: Repo map (markdown), summary terstruktur, indeks path,
outline, model. Semuanya turunan.

Yang **tidak disimpan**: isi file mentah. ZIP diproses di memori lalu dibuang.
Ini keputusan privasi yang disengaja (PRD §9.5) dan konsekuensinya jujur: kalau
nanti butuh potongan kode yang lebih dalam, user unggah ulang. Menyimpan seluruh
kode user berarti menjadi penampung kode orang lain — tanggung jawab yang tidak
sepadan untuk fitur tahap pembuktian.

---

## 11. Memakai snapshot saat generate task

### 11.1 Injeksi selektif (satu panggilan, bukan N)

Godaan yang harus ditolak: satu panggilan LLM per task untuk mengambil konteks
kode. Untuk 10 task itu 10× biaya dan 10× latensi.

Rancangan v1 tetap **satu panggilan**:

1. Prompt task menerima PRD + Repo map ringkas + **daftar path nyata** (dipangkas
   ke ≈400 path paling relevan). Model memilih **dari menu**, tidak mengarang.
2. Model mengembalikan tiap task beserta path yang relevan menurutnya.
3. Server **memverifikasi** tiap path terhadap indeks nyata, lalu **memperkaya**
   secara deterministik: outline, konvensi terkait, model data terkait.

Yang sampai ke `context_slice.codebase` karenanya adalah campuran: pilihan model
yang sudah disaring + fakta dari pemindai. Model tidak pernah menjadi sumber
kebenaran soal isi repo.

### 11.2 Verifikasi path (perluasan gagasan T3.3)

Path yang disebut model dicocokkan ke indeks: sama persis → diterima; mirip
(beda case/ekstensi) → dinormalisasi; tidak ada → dua kemungkinan yang **harus
dibedakan**:

- **File baru yang wajar** — lokasinya konsisten dengan konvensi repo. Ditandai
  `new: true`, bukan error. Menambah file memang pekerjaan yang sah.
- **Path karangan** — tidak cocok konvensi mana pun. Masuk
  `consistency_warnings` sebagai peringatan **non-blocking**, seperti T3.3.

### 11.3 Stale detection untuk snapshot repo

Dokumen `codebase` memakai kolom `version` yang sama dengan PRD, jadi tiap
ingest ulang menaikkan versi dan mendapat riwayat di `document_versions` gratis.

`tasks.source_document_id` tetap menunjuk **PRD** (satu task punya satu sumber
utama). Versi snapshot yang dipakai task disimpan di
`context_slice.codebase.snapshot_version`. Task jadi stale bila **salah satu**:

- `documents.version > tasks.source_document_version` (PRD berubah — sudah ada), **atau**
- `codebase_doc.version > context_slice->'codebase'->>'snapshot_version'` (repo berubah).

UI stale (T3.1) dan regenerate selektif (T3.2) dipakai ulang tanpa perubahan
bentuk — hanya alasannya yang perlu dibedakan, supaya user tahu apakah yang
berubah PRD-nya atau repo-nya.

### 11.4 Konsistensi checker versi kode

`lib/ai/consistency.ts` sekarang membandingkan entity task dengan entity PRD.
Dengan snapshot, pembandingnya bertambah: **model nyata dari kode**. Tiga
keadaan yang berbeda artinya, dan semuanya non-blocking:

| Keadaan | Arti | Sinyal |
|---|---|---|
| Ada di PRD, ada di kode | fitur mengubah yang sudah ada | tidak ada peringatan |
| Ada di PRD, tidak ada di kode | entity baru — wajar | info, bukan peringatan |
| Tidak ada di PRD, tidak ada di kode | kemungkinan karangan | peringatan (seperti sekarang) |
| Tidak ada di PRD, ada di kode | PRD-nya yang kurang lengkap | peringatan, arahkan ke PRD |

Baris terakhir adalah nilai tambah yang tidak mungkin didapat tanpa membaca
kode: Arsitek bisa memberi tahu user bahwa **PRD-nya** yang tertinggal.
