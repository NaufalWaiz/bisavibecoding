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

### 5.3 Di luar scope MVP

- Payment gateway nyata (skema kredit disiapkan, integrasi tidak).
- Generasi SDD/ERD penuh untuk end-user (tipe dokumen disiapkan di DB untuk nanti).
- Codebase-aware / koneksi repo (fase 2 — ini senjata utama, tapi bukan MVP).
- Komunitas & coaching.

## 6. Alur pengguna utama

1. User daftar / masuk.
2. Buat project baru, pilih tech stack.
3. Tulis ide → Arsitek tanya balik → user jawab.
4. Arsitek generate PRD (streaming) → user edit → lock.
5. Arsitek generate task dari PRD → user tinjau.
6. User copy prompt per task ke Claude Code, atau ekspor `CLAUDE.md`.
7. (Level 1) User ubah PRD → task terdampak jadi `stale` → regenerate selektif.

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
