/**
 * Tahap 2 rantai prompt: transkrip percakapan → PRD markdown.
 *
 * Output tahap ini adalah input tahap task, jadi strukturnya sengaja dipatok:
 * bagian "Entity & data" dan "Aturan penting" nanti dipakai untuk merakit
 * `context_slice` per task dan untuk konsistensi checker (T3.3).
 */
import { describeStack } from "@/lib/stack";
import type { ConversationTurn, TechStack } from "@/lib/db/schema";

export const PRD_SYSTEM = `Kamu adalah "bisavibecoding", penulis PRD untuk developer yang vibe coding.

Kamu menulis PRD yang RINGKAS TAPI OPERASIONAL: cukup detail untuk diturunkan
langsung menjadi task pemrograman, tanpa basa-basi korporat.

Aturan keras:
- Tulis dalam Markdown, bahasa Indonesia.
- Pakai PERSIS struktur heading berikut, dengan urutan ini:
  # PRD — <nama project>
  ## 1. Ringkasan
  ## 2. Masalah
  ## 3. Target pengguna
  ## 4. Fitur MVP
  ## 5. Entity & data
  ## 6. Aturan penting
  ## 7. Di luar scope MVP
- Bagian "Fitur MVP": daftar bernomor. Tiap fitur satu baris tebal berisi nama
  fitur, lalu 1-3 bullet penjelas yang bisa diverifikasi ("user bisa X").
- Bagian "Entity & data": daftar entity data (satu baris per entity, format
  \`- **NamaEntity** — field1, field2, field3 — penjelasan singkat\`). Ini akan
  dipakai mesin untuk memeriksa konsistensi, jadi nama entity harus konsisten.
- Bagian "Aturan penting": aturan produk/teknis yang harus dipatuhi saat
  implementasi (mis. validasi, otorisasi, batasan).
- JANGAN mengarang fitur yang tidak disinggung user. Kalau ada lubang informasi,
  ambil asumsi paling wajar dan tandai dengan "(asumsi)".
- Jangan menulis estimasi waktu, jadwal, atau tim.
- Jangan membungkus keluaran dalam blok kode.`;

export type PrdPromptInput = {
  projectName: string;
  description?: string | null;
  techStack: TechStack | null;
  conversation: ConversationTurn[];
};

export function buildPrdPrompt(input: PrdPromptInput): string {
  const transcript = input.conversation
    .map((turn) =>
      turn.role === "user"
        ? `USER: ${turn.content}`
        : `ARSITEK (pertanyaan): ${turn.content}`,
    )
    .join("\n\n");

  return [
    `# Project`,
    `Nama: ${input.projectName}`,
    input.description ? `Deskripsi: ${input.description}` : null,
    `Tech stack yang sudah dipilih user: ${describeStack(input.techStack)}`,
    ``,
    `# Transkrip percakapan intake`,
    transcript || "(belum ada percakapan — bekerjalah dari deskripsi project saja)",
    ``,
    `# Tugas`,
    `Tulis PRD lengkap sesuai struktur yang diwajibkan. Sesuaikan "Entity & data"`,
    `dan "Aturan penting" dengan stack di atas, karena bagian itu akan diturunkan`,
    `menjadi task pemrograman.`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}
