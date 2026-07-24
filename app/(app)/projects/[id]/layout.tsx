import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { getProject } from "@/lib/db/queries/projects";
import { getDocumentByType } from "@/lib/db/queries/documents";
import { listTasks } from "@/lib/db/queries/tasks";
import { buildPipeline } from "@/lib/project-progress";
import { Badge } from "@/components/ui/badge";
import { DeleteProjectButton } from "../delete-project-button";
import { WorkflowPipelineNav } from "./workflow-pipeline-nav";
import { ArrowLeft, ArrowRight, Cpu, FileText, Lock } from "lucide-react";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const project = await getProject(id, user.id);
  if (!project) notFound();

  const [prd, tasks] = await Promise.all([
    getDocumentByType(project.id, user.id, "prd"),
    listTasks(project.id, user.id),
  ]);

  const pipelineInput = {
    hasConversation: (project.conversation ?? []).length > 0,
    prdStatus: prd ? prd.status : null,
    prdVersion: prd ? prd.version : null,
    taskCount: tasks.length,
    staleCount: tasks.filter((task) => task.isStale).length,
  };
  const pipeline = buildPipeline(pipelineInput);

  const stack = project.techStack;
  const chips = [
    stack?.framework,
    stack?.language,
    stack?.database,
    stack?.styling,
  ].filter((chip): chip is string => Boolean(chip));

  const nextHref = `/projects/${project.id}${
    pipeline.next.segment ? `/${pipeline.next.segment}` : ""
  }`;

  return (
    <div className="flex flex-col gap-5">
      {/* Identitas project */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-warm-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <Link
              href="/projects"
              title="Kembali ke semua project"
              className="group mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-sunken text-muted-foreground shadow-warm-xs transition-warm hover:bg-surface-raised hover:text-foreground"
            >
              <ArrowLeft className="size-4 transition-warm group-hover:-translate-x-0.5" />
              <span className="sr-only">Kembali ke semua project</span>
            </Link>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-heading text-h2 tracking-tight text-foreground">
                  {project.name}
                </h1>
                {prd?.status === "locked" ? (
                  <Badge variant="success" className="gap-1.5">
                    <Lock /> PRD v{prd.version} terkunci
                  </Badge>
                ) : prd ? (
                  <Badge variant="warning" className="gap-1.5">
                    <FileText /> PRD draft
                  </Badge>
                ) : (
                  <Badge variant="secondary">Belum ada PRD</Badge>
                )}
              </div>

              {project.description ? (
                <p className="mt-1 max-w-reading text-tiny text-muted-foreground">
                  {project.description}
                </p>
              ) : null}

              {chips.length > 0 ? (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <Cpu className="size-3.5 text-muted-foreground" />
                  {chips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-md border border-border bg-surface-sunken px-2 py-0.5 font-mono text-[10px] font-medium text-muted-foreground"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {/*
             * Aksi berikutnya ditawarkan dari header, bukan hanya dari kartu
             * dashboard — pertanyaan "habis ini ngapain?" paling sering muncul
             * justru saat sedang berada di dalam project. Tetap terlihat di
             * ponsel: kalau disembunyikan, satu-satunya tombol yang tersisa di
             * layar kecil adalah tombol hapus.
             */}
            <Link
              href={nextHref}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-strong px-3.5 py-2 text-tiny font-semibold text-white shadow-warm-brand transition-warm hover:bg-brand-stronger"
            >
              {pipeline.next.label}
              <ArrowRight className="size-3.5" />
            </Link>

            <DeleteProjectButton
              projectId={project.id}
              projectName={project.name}
              variant="outline"
            />
          </div>
        </div>
      </div>

      {/*
       * Nav lengket langsung di bawah top bar — PRD dan daftar task itu
       * panjang, dan berpindah tahap seharusnya tidak menuntut scroll balik
       * ke atas.
       *
       * Tanpa wadah berlatar sama sekali: pita di belakangnya (baik putih
       * maupun sewarna kanvas) selalu terbaca sebagai kotak tersendiri yang
       * memotong halaman. Karena nav-nya menempel persis di bawah header dan
       * latarnya solid, konten yang tergulir hilang di baliknya tanpa celah.
       */}
      <WorkflowPipelineNav
        projectId={project.id}
        {...pipelineInput}
        className="sticky top-14 z-30"
      />

      <div className="min-w-0 animate-fade-up">{children}</div>
    </div>
  );
}
