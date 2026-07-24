/**
 * Tahap 1 rantai prompt: klarifikasi ide.
 *
 * Tujuan tersembunyi tahap ini adalah memandu user menghasilkan bahan PRD yang
 * baik tanpa mereka harus jago prompting. Karena itu pertanyaannya sedikit tapi
 * tajam — bukan interogasi panjang yang membuat user kabur.
 */
import { describeStack } from "@/lib/stack";
import type { ConversationTurn, TechStack } from "@/lib/db/schema";

export const IDEA_CLARIFY_SYSTEM = `Kamu adalah "bisavibecoding", partner perencanaan produk untuk developer yang vibe coding.

Tugasmu di tahap ini HANYA satu: mengajukan pertanyaan klarifikasi yang tajam atas ide mentah user.

Aturan:
- Ajukan TEPAT 2-3 pertanyaan. Tidak lebih.
- Pertanyaan harus menyasar hal yang paling menentukan bentuk produk, khususnya:
  1) siapa target user yang paling spesifik,
  2) masalah inti yang benar-benar dirasakan,
  3) batas scope MVP (apa yang SENGAJA tidak dibuat dulu).
- Jangan bertanya hal yang sudah dijawab user.
- Jangan bertanya soal teknologi/stack — stack sudah ditentukan di luar percakapan ini.
- Jangan menulis PRD, daftar fitur, atau rencana teknis. Belum saatnya.
- Setiap pertanyaan satu kalimat, konkret, dan boleh menyertakan contoh singkat
  dalam kurung agar user tahu tingkat detail yang diharapkan.

Format jawaban: markdown, daftar bernomor berisi pertanyaan saja. Boleh didahului
satu kalimat pembuka yang sangat singkat. Bahasa: Indonesia, santai tapi tajam.`;

export type ClarifyPromptInput = {
  projectName: string;
  description?: string | null;
  techStack: TechStack | null;
  /** Riwayat percakapan sebelumnya (kalau user sudah menjawab satu ronde). */
  conversation: ConversationTurn[];
  /** Pesan terbaru dari user (ide mentah atau jawaban atas pertanyaan). */
  idea: string;
};

/** Rakit prompt user untuk tahap klarifikasi. */
export function buildIdeaClarifyPrompt(input: ClarifyPromptInput): string {
  const history = input.conversation
    .map((turn) =>
      turn.role === "user"
        ? `USER: ${turn.content}`
        : `ARSITEK: ${turn.content}`,
    )
    .join("\n\n");

  return [
    `# Konteks project`,
    `Nama: ${input.projectName}`,
    input.description ? `Deskripsi: ${input.description}` : null,
    `Stack (sudah ditentukan, jangan ditanyakan): ${describeStack(input.techStack)}`,
    ``,
    history ? `# Percakapan sejauh ini\n${history}` : null,
    ``,
    `# Pesan terbaru dari user`,
    input.idea,
    ``,
    history
      ? `Berdasarkan jawaban terbaru, ajukan 2-3 pertanyaan lanjutan yang MASIH KURANG untuk menulis PRD yang baik. Kalau menurutmu bahan sudah cukup, katakan singkat bahwa bahan sudah cukup untuk menyusun PRD dan sebutkan 1 kalimat alasannya — jangan memaksakan pertanyaan baru.`
      : `Ajukan 2-3 pertanyaan klarifikasi.`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}
