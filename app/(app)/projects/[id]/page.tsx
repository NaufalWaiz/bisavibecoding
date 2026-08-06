import { notFound, redirect } from "next/navigation";
import { MessagesSquare } from "lucide-react";
import { getCurrentUser } from "@/lib/supabase/server";
import { getProject } from "@/lib/db/queries/projects";
import { PageHeader } from "@/components/app/page-header";
import { IntakeChat } from "@/components/intake-chat";

export default async function ProjectIntakePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const project = await getProject(id, user.id);
  if (!project) notFound();

  return (
    <section className="flex flex-col gap-5">
      <PageHeader
        icon={MessagesSquare}
        eyebrow="Tahap 1 · Intake"
        title="Ide & klarifikasi"
        description="Percakapan ini jadi bahan mentah PRD. Makin tajam jawabanmu, makin presisi task yang dihasilkan nanti."
      />

      <IntakeChat
        projectId={project.id}
        projectName={project.name}
        projectDescription={project.description ?? undefined}
        initialConversation={project.conversation ?? []}
      />
    </section>
  );
}
