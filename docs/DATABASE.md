# DATABASE — Arsitek

Versi: 1.0 (MVP) · ORM: Drizzle · DB: Postgres (Supabase)

Skema ini adalah fondasi fitur pembeda (integritas konteks). Patuhi persis.
Relasi antar-artefak lah yang memungkinkan stale detection & konsistensi checker.

## ERD

```mermaid
erDiagram
    profiles ||--o{ projects : owns
    projects ||--o{ documents : has
    projects ||--o{ tasks : has
    projects ||--o{ generations : logs
    documents ||--o{ document_versions : versioned_as
    documents ||--o{ tasks : source_of
    tasks ||--o{ task_feedback : receives

    profiles {
        uuid id PK "= auth.users.id"
        text email
        text plan "free|starter|pro"
        int credits
        timestamptz created_at
    }
    projects {
        uuid id PK
        uuid user_id FK
        text name
        text description
        jsonb tech_stack "framework, lang, db, dll"
        text status "active|archived"
        timestamptz created_at
        timestamptz updated_at
    }
    documents {
        uuid id PK
        uuid project_id FK
        text type "prd|sdd|erd"
        text content "markdown"
        int version
        text status "draft|locked"
        timestamptz created_at
        timestamptz updated_at
    }
    document_versions {
        uuid id PK
        uuid document_id FK
        int version
        text content
        timestamptz created_at
    }
    tasks {
        uuid id PK
        uuid project_id FK
        uuid source_document_id FK
        int source_document_version
        text title
        text goal
        jsonb files_touched
        jsonb context_slice
        jsonb acceptance_criteria
        text final_prompt
        text status "todo|in_progress|done|failed"
        int order_index
        bool is_stale
        timestamptz created_at
    }
    task_feedback {
        uuid id PK
        uuid task_id FK
        text outcome "success|failed"
        text notes
        timestamptz created_at
    }
    generations {
        uuid id PK
        uuid project_id FK
        text model
        int prompt_tokens
        int completion_tokens
        numeric cost
        timestamptz created_at
    }
```

## Catatan desain

- **profiles** memperluas `auth.users` Supabase (id sama). `credits` disiapkan
  untuk model kredit; belum ada payment di MVP.
- **documents.type** sudah menyertakan `sdd|erd` walau MVP hanya pakai `prd`. Ini
  agar fase berikutnya tidak perlu migrasi besar.
- **documents.version** naik tiap kali dokumen di-lock ulang setelah diedit. Nilai
  ini kunci stale detection.
- **document_versions** menyimpan riwayat isi tiap versi (untuk diff & regenerate).
- **tasks.source_document_version** merekam versi PRD saat task dibuat. Task stale
  bila `documents.version > tasks.source_document_version`.
- **tasks.context_slice** (jsonb) menyimpan potongan konteks relevan untuk task
  itu (entity terkait, aturan, dependensi). Fleksibel agar nanti bisa memuat
  potongan kode nyata (fitur codebase-aware) tanpa ubah skema.
- **tasks.acceptance_criteria** (jsonb) = array kriteria "selesai".
- **task_feedback** menopang loop belajar (Level 4): user menandai berhasil/gagal.
- **generations** mencatat biaya per generasi untuk basis kredit.

## Row-Level Security (Supabase)

Aktifkan RLS di semua tabel. Policy dasar: user hanya boleh SELECT/INSERT/UPDATE/
DELETE baris yang `user_id`-nya (atau lewat `project_id` → project milik dia) sama
dengan `auth.uid()`.

## Indeks yang disarankan

- `projects(user_id)`
- `documents(project_id, type)`
- `tasks(project_id, status)`
- `tasks(source_document_id)`
- `generations(project_id, created_at)`
