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
  memuat potongan kode nyata tanpa migrasi besar.
