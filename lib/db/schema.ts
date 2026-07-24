/**
 * Skema Drizzle — mengikuti `docs/DATABASE.md` persis.
 *
 * Relasi antar-artefak di sini adalah fondasi fitur pembeda (integritas
 * konteks): `documents.version` + `tasks.source_document_version` yang membuat
 * stale detection mungkin.
 */
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

/* -------------------------------------------------------------------------- */
/* Tipe domain (dipakai juga oleh lapisan AI & UI)                            */
/* -------------------------------------------------------------------------- */

export type Plan = "free" | "starter" | "pro";
export type ProjectStatus = "active" | "archived";
export type DocumentType = "prd" | "sdd" | "erd";
export type DocumentStatus = "draft" | "locked";
export type TaskStatus = "todo" | "in_progress" | "done" | "failed";
export type FeedbackOutcome = "success" | "failed";

/** Stack yang dipilih user saat membuat project. Disimpan di `projects.tech_stack`. */
export type TechStack = {
  framework: string;
  language: string;
  database: string;
  styling?: string;
  notes?: string;
};

/** Satu giliran percakapan intake ide (disimpan di `projects.conversation`). */
export type ConversationTurn = {
  role: "user" | "assistant";
  content: string;
};

/** Potongan konteks selektif per task — sengaja jsonb agar fleksibel. */
export type ContextSlice = {
  entities: string[];
  rules: string[];
  dependencies: string[];
};

/* -------------------------------------------------------------------------- */
/* Tabel                                                                       */
/* -------------------------------------------------------------------------- */

/** Memperluas `auth.users` Supabase; `id` sama dengan `auth.uid()`. */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  plan: text("plan").$type<Plan>().notNull().default("free"),
  credits: integer("credits").notNull().default(50),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    techStack: jsonb("tech_stack").$type<TechStack>(),
    /**
     * Transkrip percakapan intake ide (T1.3). Disimpan di project karena satu
     * project = satu alur ide → PRD.
     */
    conversation: jsonb("conversation")
      .$type<ConversationTurn[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    status: text("status").$type<ProjectStatus>().notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("projects_user_id_idx").on(table.userId)],
);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    type: text("type").$type<DocumentType>().notNull(),
    content: text("content").notNull().default(""),
    /** Naik tiap kali dokumen di-lock ulang setelah diedit. Kunci stale detection. */
    version: integer("version").notNull().default(1),
    status: text("status").$type<DocumentStatus>().notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("documents_project_id_type_idx").on(table.projectId, table.type)],
);

export const documentVersions = pgTable(
  "document_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("document_versions_document_id_idx").on(table.documentId),
  ],
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    sourceDocumentId: uuid("source_document_id").references(() => documents.id, {
      onDelete: "set null",
    }),
    /** Versi PRD saat task dibuat. Task stale bila documents.version lebih besar. */
    sourceDocumentVersion: integer("source_document_version"),
    title: text("title").notNull(),
    goal: text("goal").notNull(),
    filesTouched: jsonb("files_touched")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    contextSlice: jsonb("context_slice").$type<ContextSlice>(),
    acceptanceCriteria: jsonb("acceptance_criteria")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    finalPrompt: text("final_prompt").notNull(),
    status: text("status").$type<TaskStatus>().notNull().default("todo"),
    orderIndex: integer("order_index").notNull().default(0),
    isStale: boolean("is_stale").notNull().default(false),
    /**
     * Peringatan konsistensi non-blocking (T3.3): entity/fitur yang disebut task
     * tapi tidak ditemukan di PRD.
     */
    consistencyWarnings: jsonb("consistency_warnings")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("tasks_project_id_status_idx").on(table.projectId, table.status),
    index("tasks_source_document_id_idx").on(table.sourceDocumentId),
  ],
);

export const taskFeedback = pgTable(
  "task_feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    outcome: text("outcome").$type<FeedbackOutcome>().notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("task_feedback_task_id_idx").on(table.taskId)],
);

export const generations = pgTable(
  "generations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    model: text("model").notNull(),
    promptTokens: integer("prompt_tokens").notNull().default(0),
    completionTokens: integer("completion_tokens").notNull().default(0),
    cost: numeric("cost", { precision: 12, scale: 6 }).notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("generations_project_id_created_at_idx").on(
      table.projectId,
      table.createdAt,
    ),
  ],
);

/* -------------------------------------------------------------------------- */
/* Relasi                                                                      */
/* -------------------------------------------------------------------------- */

export const profilesRelations = relations(profiles, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(profiles, {
    fields: [projects.userId],
    references: [profiles.id],
  }),
  documents: many(documents),
  tasks: many(tasks),
  generations: many(generations),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  project: one(projects, {
    fields: [documents.projectId],
    references: [projects.id],
  }),
  versions: many(documentVersions),
  tasks: many(tasks),
}));

export const documentVersionsRelations = relations(
  documentVersions,
  ({ one }) => ({
    document: one(documents, {
      fields: [documentVersions.documentId],
      references: [documents.id],
    }),
  }),
);

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  sourceDocument: one(documents, {
    fields: [tasks.sourceDocumentId],
    references: [documents.id],
  }),
  feedback: many(taskFeedback),
}));

export const taskFeedbackRelations = relations(taskFeedback, ({ one }) => ({
  task: one(tasks, {
    fields: [taskFeedback.taskId],
    references: [tasks.id],
  }),
}));

export const generationsRelations = relations(generations, ({ one }) => ({
  project: one(projects, {
    fields: [generations.projectId],
    references: [projects.id],
  }),
}));

/* -------------------------------------------------------------------------- */
/* Tipe hasil select/insert                                                    */
/* -------------------------------------------------------------------------- */

export type Profile = typeof profiles.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type DocumentVersion = typeof documentVersions.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TaskFeedback = typeof taskFeedback.$inferSelect;
export type Generation = typeof generations.$inferSelect;
