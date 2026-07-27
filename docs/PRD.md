# PRD — Arsitek

Versi: 1.0 (MVP) · Status: draft · Pemilik: (kamu)

## 1. Ringkasan

Arsitek membantu developer yang "vibe coding" mengubah ide mentah menjadi rencana
yang matang, lalu menurunkannya menjadi task siap-tempel untuk AI coding agent.
Berbeda dari generator PRD biasa, Arsitek menjaga **integritas konteks** antar
artefak dan menghasilkan task yang **membawa konteksnya sendiri**, sehingga prompt
akhir lebih sering berhasil sekali jalan.

## 2. Masalah

Vibe coding gagal bukan karena AI-nya bodoh, tapi karena:
- Perencanaan dilompati, sehingga AI menebak-nebak.
- Konteks hilang di tengah jalan; dokumen dan kode jadi tidak sinkron.
- Task dihasilkan tanpa memahami kode nyata, sehingga prompt-nya melenceng.

## 3. Target pengguna

- **Utama (fase awal)**: developer di lingkaran internal pembuat (kantor, teman
  ngoding, kampus) yang sudah pakai Claude Code/Cursor.
- **Sekunder (fase penyebaran)**: developer Indonesia yang vibe coding.

## 4. Tujuan & metrik

- **Metrik utama**: % task yang prompt-nya membuat AI agent sekali jalan benar
  (dilaporkan user via feedback sederahana: "berhasil / perlu revisi").
- Metrik pendukung: jumlah project dibuat, jumlah task diekspor, retensi mingguan.

## 5. Ruang lingkup MVP

### 5.1 Fitur inti (harus ada)

**A. Autentikasi**
- Daftar/masuk via email (Supabase Auth).
- Tiap user punya profil dengan kuota kredit (angka saja, belum ada payment).

**B. Manajemen project**
- Buat, lihat, hapus project.
- Tiap project menyimpan: nama, deskripsi singkat, tech stack (dipilih user).

**C. Idea intake (mode percakapan)**
- User menulis ide bebas.
- Arsitek membalas dengan 2–3 pertanyaan klarifikasi tajam (target user, masalah
  inti, scope MVP). Bukan form panjang.
- Tujuan tersembunyi: memandu user menghasilkan bahan PRD yang baik tanpa mereka
  harus jago prompting.

**D. Generasi PRD**
- Dari hasil percakapan, generate PRD terstruktur (streaming).
- PRD bisa diedit langsung oleh user.
- PRD bisa **di-lock**. Task hanya boleh digenerate dari PRD yang sudah di-lock.

**E. Generasi task**
- Dari PRD terkunci, hasilkan daftar task terstruktur.
- Tiap task WAJIB berisi:
  - `title` — ringkas
  - `goal` — apa yang dicapai
  - `files_touched` — perkiraan file/area yang disentuh
  - `context_slice` — potongan konteks relevan (entity, aturan, dependensi)
  - `acceptance_criteria` — definisi "selesai"
  - `final_prompt` — prompt lengkap siap tempel ke AI coding agent
- Task berukuran "1 task = 1 sesi fokus AI agent". Tidak terlalu besar.

**F. Multi-model (via LimitRouter)**
- Semua model diakses lewat **LimitRouter** (gateway OpenAI-compatible) dengan
  satu API key. User/produk memilih tingkat model (default vs premium) yang
  dipetakan ke slug LimitRouter — bukan berpindah antar SDK provider.
- Ini fitur "biasa" — jangan jadikan pembeda; cukup abstraksi tipis di `lib/ai/`.

**G. Ekspor**
- Ekspor task sebagai daftar prompt (copy per task).
- Generate file `CLAUDE.md` dan `.cursorrules` dari PRD + stack, siap ditaruh di
  repo user.

### 5.2 Pembeda (dibangun setelah inti jalan)

**H. Integritas konteks (Level 1)**
- PRD punya versi. Jika PRD diubah setelah task dibuat, task turunannya ditandai
  `stale`.
- User bisa regenerate selektif hanya task yang stale, bukan semua.

**I. Konsistensi checker (Level 2)**
- Setelah generate task, validasi: apakah task menyebut entity/fitur yang tidak
  ada di PRD? Beri peringatan.

**J. Codebase-aware (Level 3)**
- Task dihasilkan dari PRD **dan** kode yang sudah ada, bukan dari asumsi proyek
  kosong. Rinciannya di §9 — ini fitur terbesar setelah MVP.

### 5.3 Di luar scope MVP

- Payment gateway nyata (skema kredit disiapkan, integrasi tidak).
- Generasi SDD/ERD penuh untuk end-user (tipe dokumen disiapkan di DB untuk nanti).
- Codebase-aware / koneksi repo — **bukan MVP**, dikerjakan sebagai Fase 4.
  Spesifikasinya ada di §9 supaya keputusan MVP tidak diambil sambil menebak
  bentuk fitur ini.
- Komunitas & coaching.

## 6. Alur pengguna utama

1. User daftar / masuk.
2. Buat project baru, pilih tech stack.
3. Tulis ide → Arsitek tanya balik → user jawab.
4. Arsitek generate PRD (streaming) → user edit → lock.
5. Arsitek generate task dari PRD → user tinjau.
6. User copy prompt per task ke Claude Code, atau ekspor `CLAUDE.md`.
7. (Level 1) User ubah PRD → task terdampak jadi `stale` → regenerate selektif.
8. (Level 3, Fase 4) User unggah repo yang sudah ada → task menyesuaikan kode
   nyata, bukan asumsi proyek kosong. Lihat §9.

## 7. Persyaratan non-fungsional

- Generasi harus streaming (tidak boleh spinner diam >2 detik tanpa output).
- Output LLM terstruktur harus tervalidasi (Zod) sebelum disimpan.
- Biaya LLM tercatat per generasi (untuk basis kredit ke depan).
- Data user terisolasi (row-level security via Supabase).

## 8. Risiko & mitigasi

- **Output LLM tidak konsisten formatnya** → paksa JSON + validasi Zod + retry.
- **Biaya LLM membengkak** → suntik konteks selektif per task, bukan semua.
- **Produk jadi "generator dokumen" biasa** → prioritaskan integritas konteks &
  kualitas prompt akhir, ukur dengan metrik "sekali jalan benar".

---

## 9. Codebase-aware task generation (Fase 4)

Status: **rancangan** (belum diimplementasi). Arsitektur teknisnya di
`docs/ARCHITECTURE.md` §9–§11; task pengerjaannya di `docs/TASKS.md` FASE 4.

### 9.1 Masalah yang diselesaikan

MVP menghasilkan task yang benar **untuk proyek kosong**. Padahal mayoritas
pekerjaan nyata bukan bikin proyek baru, tapi menambah fitur ke kode yang sudah
ada. Di situ prompt hasil MVP mulai meleset dengan cara yang khas:

- **File yang salah.** `files_touched` menebak `src/components/…` padahal repo
  user memakai `app/(app)/…`. AI agent lalu membuat file baru di tempat yang
  salah alih-alih mengubah yang sudah ada.
- **Menduplikasi yang sudah ada.** Task menyuruh "buat helper auth" padahal
  `lib/supabase/server.ts` sudah menyediakannya. Hasilnya kode kembar.
- **Melanggar konvensi repo.** Penamaan file, alias impor (`@/`), pola server
  vs client component, cara query DB — semuanya ditebak, bukan diikuti.
- **Entity fiktif.** Task menyebut model yang tidak ada di skema nyata. T3.3
  hanya bisa membandingkan dengan PRD, dan PRD sendiri bisa salah.

Akar masalahnya satu: **PRD mendeskripsikan yang diinginkan, bukan yang sudah
ada.** Selama Arsitek hanya membaca PRD, ia buta terhadap kenyataan repo.

Ini juga sekaligus alasan strategis: PRD generator adalah komoditas, sedangkan
tool yang paham repo nyata jauh lebih sulit ditiru dan langsung terasa bedanya
di metrik utama ("sekali jalan benar").

### 9.2 Alur pengguna

1. Di project yang sudah punya PRD terkunci, user membuka tab **Codebase**.
2. User mengunggah **ZIP** repo-nya (tanpa `node_modules` — UI menyebutkan ini
   di muka, dan file semacam itu tetap dibuang otomatis kalau ikut terbawa).
3. Arsitek memindai repo secara deterministik (tanpa LLM), lalu membuat
   **Repo map**: stack terdeteksi, struktur folder, konvensi, file penting, dan
   model/skema data yang benar-benar ada di kode.
4. User membaca Repo map. Kalau ada yang salah tangkap, ia bisa mengunggah
   ulang atau melanjutkan — Repo map bersifat informatif, bukan gerbang.
5. User generate task seperti biasa. Bedanya sekarang tiap task membawa
   **potongan kode nyata** di `context_slice`: path file yang benar-benar ada,
   ringkasan isinya, konvensi yang berlaku, dan model data yang sudah terdefinisi.
6. `final_prompt` menyebut file nyata ("ubah `lib/db/queries/tasks.ts`"), bukan
   file khayalan.
7. Kalau repo berubah, user unggah ulang → versi snapshot naik → task turunannya
   ditandai **stale**, persis mekanisme yang sudah ada untuk PRD (§5.2 H).

### 9.3 Scope minimal yang benar-benar berguna

Yang **masuk** v1 — dipilih karena tiap butir langsung memperbaiki salah satu
kegagalan di §9.1, bukan karena terdengar canggih:

| Kemampuan | Kegagalan yang diperbaiki |
|---|---|
| Unggah ZIP + filter (buang `node_modules`, binary, file raksasa) | prasyarat |
| Deteksi stack dari manifest nyata (`package.json`, config, lockfile) | konvensi ditebak |
| Peta struktur folder + daftar path nyata | file yang salah |
| Deteksi konvensi (penamaan file, alias impor, pola komponen) | melanggar konvensi |
| Ekstraksi model/skema dari kode (Drizzle/Prisma/SQL) | entity fiktif |
| Outline simbol yang diekspor per file penting | menduplikasi yang sudah ada |
| Verifikasi path: path yang disebut task dicocokkan ke indeks nyata | file khayalan |
| Snapshot berversi → stale detection saat repo berubah | konteks basi |

Yang **tidak** masuk v1 (ditulis eksplisit supaya tidak merembes):

- **Koneksi GitHub / OAuth / webhook / auto-sync.** Alasannya di ARCHITECTURE §9.2.
- **Embedding & pencarian semantik.** Retrieval v1 deterministik berbasis path
  dan nama simbol. Vector search baru layak kalau retrieval sederhana terbukti
  gagal — dan itu harus dibuktikan dengan data, bukan diasumsikan.
- **Parsing AST penuh & analisis lintas-bahasa mendalam.** v1: TypeScript/
  JavaScript kelas satu, bahasa lain best-effort (struktur + manifest saja).
- **Menulis balik ke repo** (PR, patch, apply diff). Arsitek tetap menghasilkan
  prompt; yang mengeksekusi tetap AI agent milik user.
- **Regenerasi diff-aware** (hanya task yang terdampak file berubah). Menarik,
  tapi butuh snapshot lama vs baru; v1 cukup menandai semua task stale.
- **Monorepo multi-package** lebih dari deteksi dasar workspace.

### 9.4 Definisi berhasil

- Untuk repo nyata, ≥80% path di `files_touched` benar-benar ada di repo (atau
  merupakan file baru yang lokasinya konsisten dengan konvensi repo).
- Metrik utama "sekali jalan benar" pada project ber-codebase **lebih tinggi**
  daripada project tanpa codebase. Ini pembanding yang sudah bisa diukur karena
  T3.4 mencatat per project.
- Ingest repo ukuran wajar (≤4 MB terkompresi) selesai < 30 detik.

### 9.5 Risiko khusus fitur ini

- **Privasi.** User mengunggah kode miliknya, kadang milik perusahaan. Harus ada
  pernyataan jelas: apa yang disimpan, apa yang dikirim ke LLM, dan cara
  menghapusnya. Isi file mentah **tidak** disimpan permanen (ARCHITECTURE §10.4).
- **Repo besar.** Batas ukuran akan menolak sebagian user. Batasnya harus
  disampaikan sebelum upload, bukan setelah gagal.
- **Ringkasan yang salah lebih berbahaya daripada tanpa ringkasan** — task jadi
  salah dengan percaya diri. Karena itu Repo map selalu bisa dilihat user, dan
  path yang tidak terverifikasi selalu ditandai.
