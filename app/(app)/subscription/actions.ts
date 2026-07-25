"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles, type Plan } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/supabase/server";

export async function updateSubscriptionPlanAction(plan: Plan | "ultra") {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  try {
    await db
      .insert(profiles)
      .values({
        id: user.id,
        email: user.email ?? "",
        plan: (plan === "ultra" ? "pro" : plan) as Plan,
        credits: plan === "ultra" ? 9999 : plan === "pro" ? 500 : plan === "starter" ? 200 : 50,
      })
      .onConflictDoUpdate({
        target: profiles.id,
        set: {
          plan: (plan === "ultra" ? "pro" : plan) as Plan,
          credits: plan === "ultra" ? 9999 : plan === "pro" ? 500 : plan === "starter" ? 200 : 50,
        },
      });

    revalidatePath("/subscription");
    revalidatePath("/projects");
    return { success: true, plan };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Gagal memperbarui paket." };
  }
}
