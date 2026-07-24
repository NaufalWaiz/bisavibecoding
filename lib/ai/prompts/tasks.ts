/**
 * Tahap 3 rantai prompt: PRD terkunci → daftar task siap tempel.
 *
 * Ini titik tersulit produk (ARCHITECTURE §4). Aturan mainnya: JANGAN suntik
 * seluruh PRD ke tiap task. Model diminta memilih slice relevan per task, lalu
 * merakit `final_prompt` HANYA dari slice itu.
 */
import { describeStack } from "@/lib/stack";
import type { Task, TechStack } from "@/lib/db/schema";

export const TASKS_SYSTEM = `Kamu adalah "bisavibecoding", perencana implementasi untuk AI coding agent (Claude Code, Cursor, Windsurf).

Kamu memecah sebuah PRD menjadi task yang bisa dikerjakan satu per satu oleh AI coding agent.

Definisi ukuran task yang benar:
- 1 task = 1 sesi fokus AI agent. Cukup besar untuk berarti, cukup kecil untuk selesai sekali jalan.
- Kalau sebuah task menyentuh lebih dari ~6 file atau punya lebih dari ~6 acceptance criteria, pecah.
- Urutkan task sesuai dependensi: fondasi (skema data, auth) sebelum fitur.

Aturan KERAS soal konteks (ini yang membedakan tool ini dari generator biasa):
- \`context_slice\` harus SELEKTIF. Isi hanya entity, aturan, dan dependensi yang
  benar-benar dipakai task itu. Menyalin seluruh PRD dianggap kesalahan.
- Nama entity di \`context_slice.entities\` HARUS memakai nama yang sama persis
  dengan yang tertulis di bagian "Entity & data" pada PRD. Jangan mengarang entity baru.
- \`final_prompt\` harus BERDIRI SENDIRI: seseorang yang belum pernah membaca PRD
  harus bisa mengerjakannya hanya dari prompt itu. Rakit dari \`context_slice\`,
  bukan dari seluruh PRD.

Bentuk \`final_prompt\` yang baik (tulis sebagai teks biasa, bukan JSON):
  - Kalimat pembuka: peran + apa yang dibangun + stack.
  - "Tujuan:" satu paragraf pendek.
  - "Konteks:" entity + aturan relevan (dari context_slice).
  - "File yang disentuh:" daftar path.
  - "Kerjakan:" langkah konkret.
  - "Selesai kalau:" acceptance criteria.
  - Batasan: apa yang TIDAK boleh dikerjakan di task ini.

Bahasa: Indonesia. Jangan menambahkan field di luar schema.`;

export type TasksPromptInput = {
  projectName: string;
  techStack: TechStack | null;
  prdContent: string;
  /** Kalau diisi, model hanya diminta membuat ulang task-task ini (T3.2). */
  regenerateOnly?: Pick<Task, "title" | "goal">[];
  /** Task lain yang TIDAK diregenerasi — supaya tidak duplikat cakupan. */
  keepUntouched?: Pick<Task, "title" | "goal">[];
  /** Umpan balik validasi dari percobaan sebelumnya. */
  feedback?: string | null;
};

export function buildTasksPrompt(input: TasksPromptInput): string {
  const lines: (string | null)[] = [
    `# Project`,
    `Nama: ${input.projectName}`,
    `Tech stack: ${describeStack(input.techStack)}`,
    ``,
    `# PRD (terkunci — ini satu-satunya sumber kebenaran)`,
    input.prdContent,
    ``,
  ];

  if (input.regenerateOnly && input.regenerateOnly.length > 0) {
    lines.push(
      `# Tugas`,
      `PRD di atas sudah berubah sejak task berikut dibuat. Buat ULANG HANYA task-task ini,`,
      `dengan cakupan yang sama tapi disesuaikan dengan PRD versi terbaru.`,
      `Kembalikan tepat ${input.regenerateOnly.length} task, dalam urutan yang sama:`,
      ...input.regenerateOnly.map(
        (task, index) => `${index + 1}. ${task.title} — ${task.goal}`,
      ),
    );

    if (input.keepUntouched && input.keepUntouched.length > 0) {
      lines.push(
        ``,
        `Task berikut TIDAK diregenerasi dan tetap ada. Jangan menduplikasi cakupannya:`,
        ...input.keepUntouched.map((task) => `- ${task.title}`),
      );
    }
  } else {
    lines.push(
      `# Tugas`,
      `Pecah PRD di atas menjadi daftar task implementasi, terurut sesuai dependensi.`,
      `Mulai dari fondasi (skema data, auth, tooling) lalu fitur.`,
      `Untuk tiap task, isi context_slice secara selektif dan rakit final_prompt dari slice itu.`,
    );
  }

  if (input.feedback) {
    lines.push(``, `# Perbaikan yang diminta`, input.feedback);
  }

  return lines.filter((line) => line !== null).join("\n");
}
