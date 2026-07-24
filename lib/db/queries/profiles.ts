import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles, type Profile } from "@/lib/db/schema";

export async function getProfile(userId: string): Promise<Profile | null> {
  const [row] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return row ?? null;
}

/**
 * Jaring pengaman: trigger `on_auth_user_created` biasanya sudah membuat baris
 * profile saat user daftar (lihat migrasi 0001). Fungsi ini memastikan profile
 * tetap ada kalau trigger belum terpasang di environment tertentu.
 */
export async function ensureProfile(
  userId: string,
  email: string,
): Promise<Profile> {
  const existing = await getProfile(userId);
  if (existing) return existing;

  const [created] = await db
    .insert(profiles)
    .values({ id: userId, email, plan: "free", credits: 50 })
    .onConflictDoNothing()
    .returning();

  return created ?? ((await getProfile(userId)) as Profile);
}
