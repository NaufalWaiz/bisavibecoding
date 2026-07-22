# TASKS — Arsitek

Urutan pengerjaan untuk Claude Code. Kerjakan **berurutan**, satu task = satu sesi
fokus. Anggap task selesai hanya kalau semua acceptance criteria terpenuhi.
Konfirmasi asumsi yang ambigu sebelum menulis banyak kode.

Legenda status: `[ ]` belum · `[~]` sedang · `[x]` selesai.

---

## FASE 0 — Fondasi

### [ ] T0.1 — Inisialisasi proyek
**Goal**: Proyek Next.js siap dengan tooling dasar.
**Files**: root, `app/`, `tailwind.config.ts`, `tsconfig.json`
**Context**: Next.js 15 App Router, TypeScript strict, Tailwind, shadcn/ui.
**Langkah**: init Next.js + TS strict; pasang Tailwind; init shadcn/ui; pasang
`drizzle-orm`, `drizzle-kit`, `@supabase/supabase-js`, `ai`, `zod`.
**Acceptance**:
- `npm run dev` jalan tanpa error.
- `npm run typecheck` (tsc --noEmit) lulus.
- shadcn siap (uji satu `Button`).

### [ ] T0.2 — Koneksi Supabase & env
**Goal**: Client Supabase + env terkonfigurasi.
**Files**: `lib/supabase/`, `.env.example`
**Context**: butuh `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, dan var LimitRouter: `LIMITROUTER_API_KEY`,
`LIMITROUTER_BASE_URL`, `AI_MODEL_DEFAULT`, `AI_MODEL_PREMIUM`. (Tidak ada lagi
`ANTHROPIC_API_KEY`/`OPENAI_API_KEY` — semua model lewat LimitRouter.)
**Acceptance**:
- Helper client (browser & server) tersedia di `lib/supabase/`.
- `.env.example` mencantum semua var di atas.

### [ ] T0.3 — Skema database (Drizzle)
**Goal**: Semua tabel di `docs/DATABASE.md` terdefinisi & termigrasi.
**Files**: `lib/db/schema.ts`, config drizzle, folder migrasi
**Context**: Ikuti ERD di `docs/DATABASE.md` PERSIS — tabel profiles, projects,
documents, document_versions, tasks, task_feedback, generations. Perhatikan
`documents.version`, `tasks.source_document_version`, `tasks.is_stale`.
**Acceptance**:
- `drizzle-kit` menghasilkan migrasi tanpa error.
- Semua tabel & kolom sesuai DATABASE.md.
- RLS diaktifkan dengan policy dasar (user hanya akses datanya).

### [ ] T0.4 — Autentikasi
**Goal**: User bisa daftar, masuk, keluar.
**Files**: `app/(auth)/`, `lib/supabase/`, middleware
**Context**: Supabase Auth (email). Saat user pertama kali daftar, buat baris
`profiles` (id = auth.uid, plan=`free`, credits default mis. 50).
**Acceptance**:
- Register/login/logout berfungsi.
- Route `(app)/*` dilindungi; belum login → redirect ke login.
- Baris `profiles` otomatis terbuat saat daftar.

---

## FASE 1 — Idea → PRD

### [ ] T1.1 — CRUD project
**Goal**: User bisa buat/lihat/hapus project.
**Files**: `app/(app)/projects/`, `lib/db/queries/projects.ts`
**Context**: Field project: name, description, tech_stack (jsonb). Sediakan UI
pilih stack (framework, bahasa, DB) yang tersimpan di tech_stack.
**Acceptance**:
- Buat project dengan nama + pilih stack → tersimpan.
- Daftar project hanya menampilkan milik user (RLS).
- Hapus project berfungsi (cascade ke dokumen & task).

### [ ] T1.2 — Lapisan AI (LimitRouter, multi-model via slug) + prompt idea-clarify
**Goal**: Satu pintu pemanggilan LLM + tahap klarifikasi ide.
**Files**: `lib/ai/index.ts`, `lib/ai/models.ts`,
`lib/ai/prompts/idea-clarify.ts`, `app/api/ai/clarify/route.ts`
**Context**: Vercel AI SDK dengan klien OpenAI-compatible (`@ai-sdk/openai`,
`createOpenAI`) yang `baseURL`-nya diarahkan ke `LIMITROUTER_BASE_URL` dan
`apiKey` = `LIMITROUTER_API_KEY`. `lib/ai/models.ts` mengekspor slug default &
premium dari `AI_MODEL_DEFAULT`/`AI_MODEL_PREMIUM` plus `resolveModel(tier)`.
`lib/ai/index.ts` ekspor `streamText()` & `generateStructured(schema, ...)` yang
menerima `tier` (`'default' | 'premium'`) dan memetakannya ke slug lewat
`models.ts` — bukan berganti SDK provider. Integrasi LimitRouter tetap terisolasi
di `lib/ai/`; route hanya kenal `tier`. API key hanya di server. Prompt
idea-clarify: terima ide mentah, hasilkan 2–3 pertanyaan klarifikasi tajam
(target user, masalah inti, scope MVP) — bukan interogasi panjang.
**Acceptance**:
- `POST /api/ai/clarify` menerima ide, streaming balik pertanyaan.
- Ganti `tier` berfungsi (default & premium terpetakan ke slug LimitRouter).
- Tidak ada API key / `baseURL` LimitRouter bocor ke client.

### [ ] T1.3 — UI percakapan intake
**Goal**: User menulis ide, menjawab pertanyaan klarifikasi.
**Files**: `app/(app)/projects/[id]/`, komponen chat
**Context**: Mode percakapan, bukan form. Simpan transkrip jawaban untuk dipakai
generate PRD. Streaming response terlihat hidup (tanpa spinner diam).
**Acceptance**:
- User kirim ide → lihat pertanyaan (streaming) → jawab.
- Transkrip tersimpan/terkait project.

### [ ] T1.4 — Generasi PRD + edit + lock
**Goal**: Hasilkan PRD dari percakapan; bisa diedit dan dikunci.
**Files**: `lib/ai/prompts/prd.ts`, `app/api/ai/prd/route.ts`,
`lib/db/queries/documents.ts`, UI editor PRD
**Context**: Prompt prd menerima transkrip + stack → PRD markdown terstruktur
(ringkasan, target user, fitur, entity/data, scope MVP). Simpan sebagai
`documents(type='prd', status='draft', version=1)`. User edit → simpan.
Tombol **Lock** mengubah status ke `locked`; edit setelah lock lalu lock lagi
menaikkan `version` dan menulis `document_versions`.
**Acceptance**:
- PRD ter-generate (streaming) & tersimpan.
- Edit + simpan berfungsi.
- Lock berfungsi; task hanya boleh dibuat dari PRD locked.
- Re-lock setelah edit menaikkan version + catat ke document_versions.

---

## FASE 2 — PRD → Task (RILIS INTERNAL DI SINI)

### [ ] T2.1 — Skema Zod untuk task
**Goal**: Struktur output task yang ketat.
**Files**: `lib/ai/schemas/tasks.ts`
**Context**: Tiap task: title, goal, files_touched (string[]), context_slice
(objek: entities[], rules[], dependencies[]), acceptance_criteria (string[]),
final_prompt (string). Daftar task = array.
**Acceptance**:
- `taskListSchema` (Zod) mendefinisikan semua field di atas.
- Ada helper parse+validasi yang retry 1x saat gagal, lalu gagal rapi.

### [ ] T2.2 — Generasi task dari PRD
**Goal**: Dari PRD locked, hasilkan task terstruktur & tersimpan.
**Files**: `lib/ai/prompts/tasks.ts`, `app/api/ai/tasks/route.ts`,
`lib/db/queries/tasks.ts`
**Context**: Prompt tasks menerima PRD locked + stack. Pecah jadi task berukuran
"1 task = 1 sesi AI agent". WAJIB isi context_slice selektif (hanya entity/aturan
relevan per task, bukan seluruh PRD) dan rakit final_prompt siap tempel dari slice
itu. Simpan tiap task dengan `source_document_id` & `source_document_version` =
versi PRD saat ini, `is_stale=false`. Catat biaya ke `generations`.
**Acceptance**:
- Generate menghasilkan ≥1 task valid (lolos Zod) tersimpan.
- Tiap task punya final_prompt yang berdiri sendiri (bisa dipahami tanpa buka PRD).
- source_document_version terisi benar.
- Baris `generations` tercatat.

### [ ] T2.3 — UI daftar & detail task
**Goal**: Tinjau task dan salin prompt.
**Files**: `app/(app)/projects/[id]/tasks/`, komponen task
**Context**: Tampilkan task terurut (`order_index`). Detail menampilkan goal,
files, acceptance criteria, dan final_prompt dengan tombol **Copy**. Status task
bisa diubah (todo/in_progress/done/failed).
**Acceptance**:
- Daftar task tampil terurut.
- Tombol Copy menyalin final_prompt.
- Ubah status task tersimpan.

### [ ] T2.4 — Ekspor CLAUDE.md & .cursorrules
**Goal**: Hasilkan file aturan repo dari PRD + stack.
**Files**: `lib/ai/prompts/rules-file.ts`, `app/api/ai/rules/route.ts`, UI export
**Context**: Dari PRD + stack, hasilkan konten `CLAUDE.md` (ringkasan proyek,
stack, konvensi) dan `.cursorrules`. Sediakan tombol download / copy.
**Acceptance**:
- User bisa generate & unduh/salin `CLAUDE.md` dan `.cursorrules`.
- Isi mencerminkan stack & ringkasan PRD project tsb.

> **CHECKPOINT**: Setelah T2.4, rilis ke lingkaran internal. Kumpulkan data satu
> pertanyaan: "final_prompt bikin AI-mu sekali jalan benar atau perlu revisi?"
> Biarkan jawaban menentukan prioritas Fase 3.

---

## FASE 3 — Pembeda (integritas konteks)

### [ ] T3.1 — Stale detection
**Goal**: Task turunan ditandai saat PRD berubah.
**Files**: `lib/db/queries/tasks.ts`, UI badge stale
**Context**: Task stale bila `documents.version > tasks.source_document_version`.
Hitung saat memuat task; tandai `is_stale` & tampilkan badge.
**Acceptance**:
- Edit + re-lock PRD → task lama tampil "stale".
- Task baru dari versi terbaru tidak stale.

### [ ] T3.2 — Regenerate selektif
**Goal**: Regenerate hanya task stale.
**Files**: route tasks, UI
**Context**: Tombol "Regenerate stale" hanya memproses task berstatus stale;
pertahankan yang lain. Perbarui source_document_version-nya.
**Acceptance**:
- Hanya task stale yang diganti; task non-stale utuh.
- Setelah regenerate, tak ada lagi yang stale.

### [ ] T3.3 — Konsistensi checker
**Goal**: Deteksi task yang menyebut entity/fitur di luar PRD.
**Files**: `lib/ai/` atau util, UI warning
**Context**: Setelah generate task, bandingkan entity/fitur yang disebut task
dengan yang ada di PRD. Beri peringatan non-blocking pada task yang menyimpang.
**Acceptance**:
- Task yang merujuk entity tak ada di PRD memunculkan peringatan.
- Peringatan tidak menghalangi pemakaian (hanya sinyal).

### [ ] T3.4 — Feedback loop task
**Goal**: User menandai hasil task (berhasil/perlu revisi).
**Files**: `lib/db/queries/task_feedback.ts`, UI
**Context**: Simpan ke `task_feedback` (outcome + notes). Ini bahan metrik utama
"sekali jalan benar" dan basis loop belajar ke depan.
**Acceptance**:
- User bisa tandai success/failed + catatan; tersimpan.
- Ada ringkasan sederhana: % task success per project.

---

## Setelah MVP (jangan kerjakan dulu)

- **Codebase-aware**: koneksi repo (upload zip / GitHub), isi `context_slice`
  dengan potongan kode nyata. Ini senjata utama vs kompetitor.
- **Kredit & payment**: integrasi gateway berbasis tabel `generations`.
- **Generasi SDD/ERD** untuk end-user (skema `documents` sudah siap).
