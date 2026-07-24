import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { getProject } from "@/lib/db/queries/projects";
import { getDocumentByType } from "@/lib/db/queries/documents";
import { listTasks } from "@/lib/db/queries/tasks";
import { RulesExport } from "./rules-export";

export default async function ExportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const project = await getProject(id, user.id);
  if (!project) notFound();

  const prd = await getDocumentByType(project.id, user.id, "prd");
  const tasks = await listTasks(project.id, user.id);

  return (
    <RulesExport
      projectId={project.id}
      projectName={project.name}
      hasPrd={Boolean(prd && prd.content.trim())}
      tasks={tasks.map((task) => ({
        title: task.title,
        goal: task.goal,
        finalPrompt: task.finalPrompt,
      }))}
    />
  );
}
