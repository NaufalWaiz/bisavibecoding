/**
 * Tahap 4 (cabang): PRD + stack → file aturan repo (`CLAUDE.md`, `.cursorrules`).
 *
 * File ini ditaruh user di repo mereka, jadi isinya harus langsung berguna bagi
 * AI coding agent: konteks produk, stack, konvensi, dan larangan.
 */
import { describeStack } from "@/lib/stack";
import type { TechStack } from "@/lib/db/schema";

export type RulesFileKind = "claude" | "cursor";

export const RULES_FILE_LABEL: Record<RulesFileKind, string> = {
  claude: "CLAUDE.md",
  cursor: ".cursorrules",
};

const CLAUDE_SYSTEM = `Kamu menulis file \`CLAUDE.md\` untuk sebuah repo — file yang dibaca otomatis oleh Claude Code di setiap sesi.

Bentuk keluaran: Markdown murni, siap disimpan apa adanya sebagai CLAUDE.md.
Jangan membungkusnya dalam blok kode. Jangan menambahkan penjelasan di luar file.

Struktur wajib:
# CLAUDE.md — <nama project>
## 1. Apa yang sedang kita bangun   (2-4 kalimat + apa yang membuatnya beda)
## 2. Tech stack                    (daftar, sebutkan versi/pilihan konkret)
## 3. Aturan kode                   (konvensi konkret & bisa dicek, bukan slogan)
## 4. Struktur folder                (blok kode berisi pohon folder yang diharapkan)
## 5. Alur kerja                     (cara menambah fitur, cara menjalankan cek)
## 6. Yang TIDAK dikerjakan sekarang (scope yang sengaja ditunda)

Aturan isi:
- Turunkan SEMUA isi dari PRD dan stack yang diberikan. Jangan mengarang fitur.
- Aturan kode harus spesifik untuk stack itu (mis. kalau Next.js App Router:
  di mana server logic hidup, bagaimana data diakses, di mana validasi dilakukan).
- Bahasa: Indonesia. Padat, tanpa basa-basi.`;

const CURSOR_SYSTEM = `Kamu menulis file \`.cursorrules\` untuk sebuah repo — instruksi yang dibaca Cursor di setiap sesi.

Bentuk keluaran: teks biasa, siap disimpan apa adanya sebagai .cursorrules.
Jangan membungkusnya dalam blok kode. Jangan menambahkan penjelasan di luar file.

Format: daftar aturan berpoin, dikelompokkan dengan judul pendek berhuruf kapital
(mis. KONTEKS PRODUK, STACK, ATURAN KODE, STRUKTUR, JANGAN LAKUKAN).
Lebih ringkas daripada CLAUDE.md — maksimal sekitar 60 baris.

Aturan isi:
- Turunkan semua dari PRD dan stack yang diberikan. Jangan mengarang fitur.
- Tiap aturan satu baris, imperatif, bisa diperiksa.
- Bahasa: Indonesia.`;

export function rulesFileSystem(kind: RulesFileKind): string {
  return kind === "claude" ? CLAUDE_SYSTEM : CURSOR_SYSTEM;
}

export type RulesPromptInput = {
  kind: RulesFileKind;
  projectName: string;
  description?: string | null;
  techStack: TechStack | null;
  prdContent: string;
};

export function buildRulesFilePrompt(input: RulesPromptInput): string {
  return [
    `# Project`,
    `Nama: ${input.projectName}`,
    input.description ? `Deskripsi: ${input.description}` : null,
    `Tech stack: ${describeStack(input.techStack)}`,
    ``,
    `# PRD`,
    input.prdContent,
    ``,
    `# Tugas`,
    `Tulis isi file ${RULES_FILE_LABEL[input.kind]} untuk repo project ini.`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}
