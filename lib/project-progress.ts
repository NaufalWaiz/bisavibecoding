/**
 * Satu sumber kebenaran untuk "project ini sudah sampai mana".
 *
 * Dipakai bersama oleh kartu di dashboard dan navigasi pipeline di dalam
 * workspace. Sebelumnya keduanya menghitung sendiri — dashboard memakai rumus
 * empat langkah yang salah satunya (`hasTasks && isPrdLocked`) menduplikasi
 * langkah lain, sehingga persentasenya tidak pernah bisa 100%.
 *
 * Tidak menyentuh DB atau `server-only`: aman diimpor komponen client.
 */

export type StepKey = "idea" | "prd" | "tasks" | "export";

/** `blocked` = prasyaratnya belum ada, jadi membukanya belum ada gunanya. */
export type StepStatus = "done" | "warn" | "todo" | "blocked";

export type PipelineInput = {
  hasConversation: boolean;
  prdStatus: "locked" | "draft" | null;
  prdVersion: number | null;
  taskCount: number;
  staleCount: number;
};

export type PipelineStep = {
  key: StepKey;
  num: number;
  /** Segmen URL relatif terhadap `/projects/[id]`. Kosong = tab pertama. */
  segment: string;
  label: string;
  status: StepStatus;
  /** Baris kedua di kartu langkah — keadaan sekarang, bukan instruksi. */
  detail: string;
  /** Alasan kalau langkah ini belum ada gunanya dibuka. */
  blockedReason?: string;
};

export type NextAction = {
  label: string;
  segment: string;
  /** Kalimat pendek: kenapa ini langkah berikutnya. */
  hint: string;
};

export type Pipeline = {
  steps: PipelineStep[];
  /** Jumlah langkah yang benar-benar tuntas (0–4). */
  completed: number;
  percent: number;
  next: NextAction;
};

export function buildPipeline(input: PipelineInput): Pipeline {
  const { hasConversation, prdStatus, prdVersion, taskCount, staleCount } = input;

  const prdLocked = prdStatus === "locked";
  const hasPrd = prdStatus !== null;
  const tasksFresh = taskCount > 0 && staleCount === 0;

  const steps: PipelineStep[] = [
    {
      key: "idea",
      num: 1,
      segment: "",
      label: "Ide",
      status: hasConversation ? "done" : "todo",
      detail: hasConversation ? "Percakapan tersimpan" : "Belum dimulai",
    },
    {
      key: "prd",
      num: 2,
      segment: "prd",
      label: "PRD",
      status: prdLocked ? "done" : hasPrd ? "warn" : "todo",
      detail: prdLocked
        ? `Terkunci v${prdVersion ?? 1}`
        : hasPrd
          ? "Draft, belum dikunci"
          : "Belum dibuat",
    },
    {
      key: "tasks",
      num: 3,
      segment: "tasks",
      label: "Task",
      status: !prdLocked
        ? "blocked"
        : tasksFresh
          ? "done"
          : taskCount > 0
            ? "warn"
            : "todo",
      detail:
        taskCount === 0
          ? "Belum ada task"
          : staleCount > 0
            ? `${taskCount} task · ${staleCount} stale`
            : `${taskCount} task siap`,
      blockedReason: prdLocked ? undefined : "Kunci PRD dulu",
    },
    {
      key: "export",
      num: 4,
      segment: "export",
      label: "Ekspor",
      status: !hasPrd ? "blocked" : tasksFresh ? "done" : "todo",
      detail: !hasPrd
        ? "Perlu PRD"
        : taskCount > 0
          ? "Siap diunduh"
          : "CLAUDE.md & .cursorrules",
      blockedReason: hasPrd ? undefined : "Buat PRD dulu",
    },
  ];

  const completed = steps.filter((step) => step.status === "done").length;

  return {
    steps,
    completed,
    percent: Math.round((completed / steps.length) * 100),
    next: nextAction(input),
  };
}

function nextAction(input: PipelineInput): NextAction {
  const { hasConversation, prdStatus, taskCount, staleCount } = input;

  if (!hasConversation) {
    return {
      label: "Mulai intake ide",
      segment: "",
      hint: "Ceritakan idenya — jawabanmu jadi bahan mentah PRD.",
    };
  }
  if (prdStatus === null) {
    return {
      label: "Generate PRD",
      segment: "prd",
      hint: "Percakapan sudah cukup untuk disusun jadi dokumen.",
    };
  }
  if (prdStatus === "draft") {
    return {
      label: "Kunci PRD",
      segment: "prd",
      hint: "Task hanya bisa dibuat dari PRD yang sudah dikunci.",
    };
  }
  if (taskCount === 0) {
    return {
      label: "Generate task",
      segment: "tasks",
      hint: "PRD terkunci — turunkan jadi task siap tempel.",
    };
  }
  if (staleCount > 0) {
    return {
      label: `Regenerate ${staleCount} task stale`,
      segment: "tasks",
      hint: "PRD sudah berubah setelah task ini dibuat.",
    };
  }
  return {
    label: "Ekspor file repo",
    segment: "export",
    hint: "Semua siap — tinggal ambil file untuk repo.",
  };
}
