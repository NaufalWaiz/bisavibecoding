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

export type ParseTaskListOptions = {
  /**
   * Jumlah task yang WAJIB dikembalikan. Dipakai saat regenerate selektif
   * (T3.2): hasilnya dipasangkan satu-satu dengan task stale menurut urutan,
   * jadi jumlah yang meleset berarti ada task stale yang tidak kebagian
   * pengganti — dan task itu akan tetap stale setelah operasi yang mengaku
   * berhasil. Diperlakukan sebagai kegagalan validasi supaya kena retry.
   */
  expectedCount?: number;
};

type Attempt =
  | { ok: true; data: TaskListOutput }
  | { ok: false; issues: string[] };

function validate(raw: unknown, options: ParseTaskListOptions): Attempt {
  const parsed = taskListSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, issues: formatIssues(parsed.error) };

  const { expectedCount } = options;
  if (expectedCount !== undefined && parsed.data.tasks.length !== expectedCount) {
    return {
      ok: false,
      issues: [
        `tasks: harus berisi TEPAT ${expectedCount} task, bukan ${parsed.data.tasks.length}. ` +
          `Kembalikan satu task pengganti untuk tiap task yang diminta, dengan urutan yang sama persis.`,
      ],
    };
  }

  return { ok: true, data: parsed.data };
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
  options: ParseTaskListOptions = {},
): Promise<TaskListOutput> {
  const first = validate(await produce(null), options);
  if (first.ok) return first.data;

  const second = validate(
    await produce(
      `Output sebelumnya tidak lolos validasi:\n- ${first.issues.join("\n- ")}\nPerbaiki dan kembalikan JSON yang sesuai schema.`,
    ),
    options,
  );
  if (second.ok) return second.data;

  throw new TaskValidationError(
    "Output task tidak lolos validasi setelah 2 percobaan.",
    second.issues,
  );
}
