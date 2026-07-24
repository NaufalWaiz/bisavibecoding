/**
 * Konsistensi checker (T3.3).
 *
 * Membandingkan entity yang disebut sebuah task dengan entity yang benar-benar
 * ada di PRD. Peringatannya NON-BLOCKING: ini sinyal buat user, bukan penjaga
 * gerbang. Sengaja deterministik (tanpa LLM) supaya murah dan bisa dipercaya.
 */
import type { TaskOutput } from "./schemas/tasks";

/** Normalisasi nama entity agar `document_versions` ≈ `DocumentVersion`. */
function normalize(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Bentuk tunggal kasar untuk bahasa Inggris (`projects` → `project`). */
function singular(name: string): string {
  const value = normalize(name);
  if (value.endsWith("ies") && value.length > 4)
    return `${value.slice(0, -3)}y`;
  if (value.endsWith("ses") && value.length > 4) return value.slice(0, -2);
  if (value.endsWith("s") && !value.endsWith("ss") && value.length > 3)
    return value.slice(0, -1);
  return value;
}

/**
 * Ambil daftar entity dari PRD.
 *
 * Prompt PRD mewajibkan bagian "## 5. Entity & data" berisi baris
 * `- **NamaEntity** — field…`. Kalau bagian itu tidak ketemu (mis. PRD diedit
 * manual), fallback ke semua teks tebal di dokumen.
 */
export function extractPrdEntities(prdContent: string): string[] {
  const section = prdContent.match(
    /##\s*\d*\.?\s*Entity\s*&?\s*data([\s\S]*?)(?=\n##\s|\s*$)/i,
  );
  const scope = section ? section[1] : prdContent;

  const bold = [...scope.matchAll(/\*\*(.+?)\*\*/g)].map((match) =>
    match[1].trim(),
  );
  if (bold.length > 0) return unique(bold);

  // Fallback terakhir: baris daftar yang diawali nama diikuti em dash.
  const listed = [...scope.matchAll(/^\s*[-*]\s*([A-Za-z_][\w ]{1,40}?)\s*[—-]/gm)].map(
    (match) => match[1].trim(),
  );
  return unique(listed);
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}

export type ConsistencyReport = {
  /** Entity yang disebut task tapi tidak ditemukan di PRD. */
  unknownEntities: string[];
  warnings: string[];
};

/**
 * Periksa satu task terhadap daftar entity PRD.
 *
 * Perbandingan longgar (case/plural/underscore diabaikan) supaya peringatan
 * yang muncul benar-benar berarti, bukan derau ejaan.
 */
export function checkTaskConsistency(
  task: Pick<TaskOutput, "title" | "context_slice">,
  prdEntities: string[],
): ConsistencyReport {
  const known = new Set(prdEntities.map(singular));
  const unknownEntities = task.context_slice.entities.filter(
    (entity) => !known.has(singular(entity)),
  );

  const warnings = unknownEntities.map(
    (entity) =>
      `Entity “${entity}” disebut task ini tapi tidak ada di bagian "Entity & data" PRD. Cek apakah PRD kurang lengkap atau task-nya melenceng.`,
  );

  return { unknownEntities, warnings };
}

/** Jalankan checker untuk sekumpulan task sekaligus. */
export function checkTaskListConsistency(
  tasks: Pick<TaskOutput, "title" | "context_slice">[],
  prdContent: string,
): ConsistencyReport[] {
  const entities = extractPrdEntities(prdContent);
  // PRD tanpa daftar entity sama sekali: jangan banjiri user dengan peringatan.
  if (entities.length === 0)
    return tasks.map(() => ({ unknownEntities: [], warnings: [] }));

  return tasks.map((task) => checkTaskConsistency(task, entities));
}
