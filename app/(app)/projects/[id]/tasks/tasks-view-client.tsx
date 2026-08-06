"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Notice } from "@/components/app/notice";
import { GenerateTasksButton, TaskGenerationShowcase } from "./generate-tasks-button";
import { TasksListClient } from "./tasks-list-client";
import type { Task } from "@/lib/db/schema";
import { ListChecks, Lock, FileText } from "lucide-react";

type Props = {
  projectId: string;
  tasks: Task[];
  staleCount: number;
  prdLocked: boolean;
  prdVersion: number | null;
  feedbackByTaskMap: Record<string, "success" | "failed" | null>;
  unknownEntitiesByTask: Record<string, string[]>;
  offPrdEntities: string[];
  insightBarNode: React.ReactNode;
};

export function TasksViewClient({
  projectId,
  tasks,
  staleCount,
  prdLocked,
  prdVersion,
  feedbackByTaskMap,
  unknownEntitiesByTask,
  offPrdEntities,
  insightBarNode,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<"all" | "stale" | null>(null);

  async function handleGenerate(mode: "all" | "stale") {
    setBusy(mode);
    try {
      const response = await fetch("/api/ai/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, mode, tier: "premium" }),
      });

      const data = (await response.json()) as {
        error?: string;
        count?: number;
        regenerated?: number;
        remainingStale?: number;
      };

      if (!response.ok) throw new Error(data.error ?? "Generasi task gagal.");

      if (mode === "all") {
        toast.success(`${data.count ?? 0} task dihasilkan.`);
      } else if (data.remainingStale && data.remainingStale > 0) {
        toast.warning(
          `${data.regenerated ?? 0} task diperbarui, tapi ${data.remainingStale} masih stale. Coba jalankan sekali lagi.`,
        );
      } else {
        toast.success(
          `${data.regenerated ?? 0} task stale diperbarui — task lain tidak tersentuh.`,
        );
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generasi task gagal.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="flex flex-col gap-5">
      {/* Header Halaman Fixed — Bebas dari Perubahan Width / Pop-up */}
      <PageHeader
        icon={ListChecks}
        eyebrow="Tahap 3 · Eksekusi"
        title="Task prompts"
        description="Tiap task membawa konteksnya sendiri. Salin final prompt-nya langsung ke Claude Code, Cursor, atau Windsurf."
        actions={
          <GenerateTasksButton
            projectId={projectId}
            hasTasks={tasks.length > 0}
            staleCount={staleCount}
            prdLocked={prdLocked}
            busy={busy}
            onGenerate={(mode) => void handleGenerate(mode)}
          />
        }
      />

      {!prdLocked ? (
        <Notice
          tone="warning"
          action={
            <Link
              href={`/projects/${projectId}/prd`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-soft-border bg-card px-3 py-1.5 text-tiny font-semibold text-amber-text shadow-warm-xs transition-warm hover:bg-amber-soft"
            >
              <Lock className="size-3.5" />
              Buka PRD
            </Link>
          }
        >
          Task hanya bisa dihasilkan dari PRD yang sudah dikunci — itu yang
          membuat tiap task punya versi sumber yang bisa dilacak.
        </Notice>
      ) : null}

      {/* Main Body Section: Tampilan Terstandarisasi In-Line Canvas Saat Generasi AI */}
      {busy !== null ? (
        <TaskGenerationShowcase mode={busy} />
      ) : (
        <>
          {tasks.length > 0 ? insightBarNode : null}

          {staleCount > 0 ? (
            <Notice
              tone="warning"
              title={`${staleCount} task dibuat dari PRD versi lama`}
              action={
                <GenerateTasksButton
                  projectId={projectId}
                  hasTasks
                  staleCount={staleCount}
                  prdLocked={prdLocked}
                  busy={busy}
                  onGenerate={(mode) => void handleGenerate(mode)}
                  staleOnly
                />
              }
            >
              PRD sekarang versi {prdVersion}. Regenerate task stale agar ikut
              menyesuaikan — task lain tidak akan tersentuh.
            </Notice>
          ) : null}

          {offPrdEntities.length > 0 ? (
            <Notice
              tone="warning"
              title={`${offPrdEntities.length} entity disebut task tapi tidak ada di PRD`}
              action={
                <Link
                  href={`/projects/${projectId}/prd`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-soft-border bg-card px-3 py-1.5 text-tiny font-semibold text-amber-text shadow-warm-xs transition-warm hover:bg-amber-soft"
                >
                  <FileText className="size-3.5" />
                  Lengkapi PRD
                </Link>
              }
            >
              <span className="flex flex-wrap items-center gap-1.5">
                {offPrdEntities.map((entity) => (
                  <code
                    key={entity}
                    className="rounded-md border border-amber-soft-border bg-card px-1.5 py-0.5 font-mono text-[11px] text-amber-text"
                  >
                    {entity}
                  </code>
                ))}
              </span>
              <span className="mt-2 block">
                Ini hanya sinyal, bukan penghalang — task tetap bisa dipakai. Entah
                PRD-nya yang kurang lengkap, atau task-nya yang mengarang entity.
              </span>
            </Notice>
          ) : null}

          {tasks.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="Belum ada task"
              description={
                prdLocked
                  ? "PRD sudah terkunci. Turunkan jadi task berukuran satu sesi fokus AI agent, lengkap dengan context slice dan acceptance criteria."
                  : "Kunci PRD terlebih dahulu, lalu task siap dihasilkan dari versi itu."
              }
              action={
                <GenerateTasksButton
                  projectId={projectId}
                  hasTasks={false}
                  staleCount={0}
                  prdLocked={prdLocked}
                  busy={busy}
                  onGenerate={(mode) => void handleGenerate(mode)}
                />
              }
            />
          ) : (
            <TasksListClient
              tasks={tasks}
              projectId={projectId}
              feedbackByTaskMap={feedbackByTaskMap}
              unknownEntitiesByTask={unknownEntitiesByTask}
            />
          )}
        </>
      )}
    </section>
  );
}
