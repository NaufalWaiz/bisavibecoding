import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { getProject } from "@/lib/db/queries/projects";
import { getDocumentByType } from "@/lib/db/queries/documents";
import { PrdEditor } from "./prd-editor";

export default async function PrdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const project = await getProject(id, user.id);
  if (!project) notFound();

  const document = await getDocumentByType(project.id, user.id, "prd");

  return (
    <section className="flex flex-col gap-6">
      <PrdEditor
        projectId={project.id}
        document={document}
        hasConversation={(project.conversation ?? []).length > 0}
      />
    </section>
  );
}
