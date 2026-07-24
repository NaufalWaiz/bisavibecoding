/**
 * Kontrak output terstruktur untuk generasi task.
 *
 * Ini adalah gerbang mutu utama produk: task yang tidak lolos schema ini tidak
 * boleh masuk DB. `context_slice` sengaja wajib — task yang tidak membawa
 * konteksnya sendiri adalah task yang gagal (PRD §5.1 E).
 */
import { z } from "zod";

export const contextSliceSchema = z.object({
  entities: z
    .array(z.string().min(1))
    .describe(
      "Nama entity/model data dari PRD yang relevan HANYA untuk task ini. Boleh kosong kalau task tidak menyentuh data.",
    ),
  rules: z
    .array(z.string().min(1))
    .describe(
      "Aturan produk/teknis dari PRD yang harus dipatuhi saat mengerjakan task ini.",
    ),
  dependencies: z
    .array(z.string().min(1))
    .describe(
      "Judul task lain yang harus selesai lebih dulu, atau prasyarat teknis (mis. 'skema DB sudah termigrasi').",
    ),
});

export const taskSchema = z.object({
  title: z
    .string()
    .min(3)
    .max(120)
    .describe("Judul ringkas, diawali kata kerja. Mis. 'Buat CRUD project'."),
  goal: z
    .string()
    .min(10)
    .max(500)
    .describe("Satu-dua kalimat: apa yang tercapai kalau task ini selesai."),
  files_touched: z
    .array(z.string().min(1))
    .min(1)
    .describe("Perkiraan path file/folder yang disentuh, sesuai konvensi stack."),
  context_slice: contextSliceSchema.describe(
    "Potongan konteks SELEKTIF untuk task ini saja — jangan salin seluruh PRD.",
  ),
  acceptance_criteria: z
    .array(z.string().min(3))
    .min(1)
    .describe("Kriteria 'selesai' yang bisa diverifikasi, bukan opini."),
  final_prompt: z
    .string()
    .min(50)
    .describe(
      "Prompt lengkap siap tempel ke AI coding agent. HARUS bisa dipahami tanpa membuka PRD: sertakan tujuan, konteks dari context_slice, file yang disentuh, dan acceptance criteria.",
    ),
});

export const taskListSchema = z.object({
  tasks: z
    .array(taskSchema)
    .min(1, "Minimal satu task.")
    .max(30, "Terlalu banyak task — pecah project-nya, bukan task-nya."),
});

export type TaskOutput = z.infer<typeof taskSchema>;
export type TaskListOutput = z.infer<typeof taskListSchema>;
export type ContextSliceOutput = z.infer<typeof contextSliceSchema>;

export class TaskValidationError extends Error {
  readonly issues: string[];

  constructor(message: string, issues: string[]) {
    super(message);
    this.name = "TaskValidationError";
    this.issues = issues;
  }
}

/** Ubah error Zod jadi daftar pesan yang bisa dibaca manusia (dan LLM). */
export function formatIssues(error: z.ZodError): string[] {
  return error.issues.map(
    (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
  );
}

/**
 * Parse + validasi output task, dengan SATU kali retry.
 *
 * `produce` dipanggil dengan `feedback = null` pada percobaan pertama; kalau
 * validasi gagal, dipanggil sekali lagi dengan daftar error sebagai umpan balik.
 * Kalau masih gagal, melempar `TaskValidationError` — gagal rapi, bukan
 * menyimpan data setengah benar.
 */
export async function parseTaskListWithRetry(
  produce: (feedback: string | null) => Promise<unknown>,
): Promise<TaskListOutput> {
  const first = taskListSchema.safeParse(await produce(null));
  if (first.success) return first.data;

  const issues = formatIssues(first.error);
  const second = taskListSchema.safeParse(
    await produce(
      `Output sebelumnya tidak lolos validasi:\n- ${issues.join("\n- ")}\nPerbaiki dan kembalikan JSON yang sesuai schema.`,
    ),
  );
  if (second.success) return second.data;

  throw new TaskValidationError(
    "Output task tidak lolos validasi setelah 2 percobaan.",
    formatIssues(second.error),
  );
}
