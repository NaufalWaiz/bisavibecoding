import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  documentVersions,
  documents,
  projects,
  type Document,
  type DocumentType,
  type DocumentVersion,
} from "@/lib/db/schema";

/** Pastikan dokumen ini milik user (koneksi Drizzle tidak terikat RLS — D-008). */
async function assertOwnership(
  documentId: string,
  userId: string,
): Promise<Document | null> {
  const [row] = await db
    .select({ document: documents })
    .from(documents)
    .innerJoin(projects, eq(projects.id, documents.projectId))
    .where(and(eq(documents.id, documentId), eq(projects.userId, userId)))
    .limit(1);
  return row?.document ?? null;
}

export async function getDocumentByType(
  projectId: string,
  userId: string,
  type: DocumentType = "prd",
): Promise<Document | null> {
  const [row] = await db
    .select({ document: documents })
    .from(documents)
    .innerJoin(projects, eq(projects.id, documents.projectId))
    .where(
      and(
        eq(documents.projectId, projectId),
        eq(documents.type, type),
        eq(projects.userId, userId),
      ),
    )
    .orderBy(desc(documents.updatedAt))
    .limit(1);
  return row?.document ?? null;
}

/**
 * Simpan hasil generasi PRD. Kalau dokumen PRD sudah ada, isinya ditimpa dan
 * statusnya kembali `draft` — versi TIDAK naik di sini. Versi hanya naik saat
 * di-lock ulang (lihat `lockDocument`), karena itulah yang dijadikan patokan
 * stale detection.
 */
export async function upsertDocument(input: {
  projectId: string;
  userId: string;
  type?: DocumentType;
  content: string;
}): Promise<Document | null> {
  const type = input.type ?? "prd";
  const existing = await getDocumentByType(input.projectId, input.userId, type);

  if (existing) {
    const [row] = await db
      .update(documents)
      .set({ content: input.content, status: "draft", updatedAt: new Date() })
      .where(eq(documents.id, existing.id))
      .returning();
    return row ?? null;
  }

  // Verifikasi kepemilikan project sebelum insert.
  const [owned] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, input.projectId), eq(projects.userId, input.userId)))
    .limit(1);
  if (!owned) return null;

  const [row] = await db
    .insert(documents)
    .values({
      projectId: input.projectId,
      type,
      content: input.content,
      version: 1,
      status: "draft",
    })
    .returning();
  return row ?? null;
}

/** Simpan hasil edit user. Dokumen yang di-lock kembali jadi `draft`. */
export async function updateDocumentContent(
  documentId: string,
  userId: string,
  content: string,
): Promise<Document | null> {
  const existing = await assertOwnership(documentId, userId);
  if (!existing) return null;

  const [row] = await db
    .update(documents)
    .set({ content, status: "draft", updatedAt: new Date() })
    .where(eq(documents.id, documentId))
    .returning();
  return row ?? null;
}

/**
 * Kunci dokumen.
 *
 * - Lock pertama (dari `draft` versi 1): status → `locked`, versi tetap 1.
 * - Lock ulang setelah diedit: versi naik 1.
 *
 * Setiap lock mencatat snapshot isi ke `document_versions` — inilah riwayat
 * yang dipakai diff & regenerate selektif.
 */
export async function lockDocument(
  documentId: string,
  userId: string,
): Promise<Document | null> {
  const existing = await assertOwnership(documentId, userId);
  if (!existing) return null;
  if (existing.status === "locked") return existing;
  if (existing.content.trim().length === 0) return null;

  // Versi naik hanya kalau versi sekarang sudah pernah dikunci.
  const [previous] = await db
    .select({ version: documentVersions.version })
    .from(documentVersions)
    .where(eq(documentVersions.documentId, documentId))
    .orderBy(desc(documentVersions.version))
    .limit(1);

  const nextVersion = previous ? previous.version + 1 : existing.version;

  const [row] = await db
    .update(documents)
    .set({ status: "locked", version: nextVersion, updatedAt: new Date() })
    .where(eq(documents.id, documentId))
    .returning();
  if (!row) return null;

  await db.insert(documentVersions).values({
    documentId,
    version: nextVersion,
    content: row.content,
  });

  return row;
}

export async function listDocumentVersions(
  documentId: string,
  userId: string,
): Promise<DocumentVersion[]> {
  const existing = await assertOwnership(documentId, userId);
  if (!existing) return [];
  return db
    .select()
    .from(documentVersions)
    .where(eq(documentVersions.documentId, documentId))
    .orderBy(desc(documentVersions.version));
}

/** Hitung jumlah dokumen PRD yang pernah dibuat user di database (untuk kuota berlangganan). */
export async function countUserPrdDocuments(userId: string): Promise<number> {
  const rows = await db
    .select({ id: documents.id })
    .from(documents)
    .innerJoin(projects, eq(projects.id, documents.projectId))
    .where(and(eq(projects.userId, userId), eq(documents.type, "prd")));
  return rows.length;
}
