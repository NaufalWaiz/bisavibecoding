-- Integrasi Supabase Auth + Row-Level Security.
--
-- Prinsip: user hanya bisa menyentuh barisnya sendiri. Kepemilikan diturunkan
-- dari `projects.user_id = auth.uid()`; tabel anak dicek lewat project-nya.

-- 1. `profiles.id` = `auth.users.id` -------------------------------------------
ALTER TABLE "profiles"
  ADD CONSTRAINT "profiles_id_auth_users_id_fk"
  FOREIGN KEY ("id") REFERENCES auth.users("id") ON DELETE CASCADE;
--> statement-breakpoint

-- 2. Trigger: buat baris profile otomatis saat user daftar ---------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, plan, credits)
  VALUES (NEW.id, COALESCE(NEW.email, ''), 'free', 50)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
--> statement-breakpoint

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
--> statement-breakpoint

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
--> statement-breakpoint

-- 3. Aktifkan RLS di semua tabel ------------------------------------------------
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "document_versions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "task_feedback" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "generations" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

-- 4. Helper: apakah artefak ini milik user yang sedang login? -------------------
CREATE OR REPLACE FUNCTION public.owns_project(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = p_project_id AND projects.user_id = auth.uid()
  );
$$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.owns_document(p_document_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.documents d
    JOIN public.projects p ON p.id = d.project_id
    WHERE d.id = p_document_id AND p.user_id = auth.uid()
  );
$$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.owns_task(p_task_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.projects p ON p.id = t.project_id
    WHERE t.id = p_task_id AND p.user_id = auth.uid()
  );
$$;
--> statement-breakpoint

-- 5. Policy --------------------------------------------------------------------

-- profiles: user hanya melihat/mengubah profilnya sendiri.
DROP POLICY IF EXISTS "profiles_select_own" ON "profiles";
--> statement-breakpoint
CREATE POLICY "profiles_select_own" ON "profiles"
  FOR SELECT TO authenticated USING (id = auth.uid());
--> statement-breakpoint
DROP POLICY IF EXISTS "profiles_update_own" ON "profiles";
--> statement-breakpoint
CREATE POLICY "profiles_update_own" ON "profiles"
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
--> statement-breakpoint
DROP POLICY IF EXISTS "profiles_insert_own" ON "profiles";
--> statement-breakpoint
CREATE POLICY "profiles_insert_own" ON "profiles"
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
--> statement-breakpoint

-- projects: kepemilikan langsung.
DROP POLICY IF EXISTS "projects_all_own" ON "projects";
--> statement-breakpoint
CREATE POLICY "projects_all_own" ON "projects"
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
--> statement-breakpoint

-- documents: lewat project.
DROP POLICY IF EXISTS "documents_all_own" ON "documents";
--> statement-breakpoint
CREATE POLICY "documents_all_own" ON "documents"
  FOR ALL TO authenticated
  USING (public.owns_project(project_id))
  WITH CHECK (public.owns_project(project_id));
--> statement-breakpoint

-- document_versions: lewat document → project.
DROP POLICY IF EXISTS "document_versions_all_own" ON "document_versions";
--> statement-breakpoint
CREATE POLICY "document_versions_all_own" ON "document_versions"
  FOR ALL TO authenticated
  USING (public.owns_document(document_id))
  WITH CHECK (public.owns_document(document_id));
--> statement-breakpoint

-- tasks: lewat project.
DROP POLICY IF EXISTS "tasks_all_own" ON "tasks";
--> statement-breakpoint
CREATE POLICY "tasks_all_own" ON "tasks"
  FOR ALL TO authenticated
  USING (public.owns_project(project_id))
  WITH CHECK (public.owns_project(project_id));
--> statement-breakpoint

-- task_feedback: lewat task → project.
DROP POLICY IF EXISTS "task_feedback_all_own" ON "task_feedback";
--> statement-breakpoint
CREATE POLICY "task_feedback_all_own" ON "task_feedback"
  FOR ALL TO authenticated
  USING (public.owns_task(task_id))
  WITH CHECK (public.owns_task(task_id));
--> statement-breakpoint

-- generations: lewat project. Hanya boleh dibaca user; penulisan dilakukan
-- server (koneksi Drizzle / service role) saat mencatat biaya generasi.
DROP POLICY IF EXISTS "generations_select_own" ON "generations";
--> statement-breakpoint
CREATE POLICY "generations_select_own" ON "generations"
  FOR SELECT TO authenticated
  USING (public.owns_project(project_id));
