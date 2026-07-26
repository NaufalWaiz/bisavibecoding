import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { getProfile } from "@/lib/db/queries/profiles";
import { countUserPrdDocuments } from "@/lib/db/queries/documents";
import { SubscriptionClient } from "./subscription-client";

export const metadata = {
  title: "Berlangganan — bisavibecoding",
  description: "Kelola paket langganan dan kuota generasi PRD & task prompt kamu.",
};

export default async function SubscriptionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [profile, prdCount] = await Promise.all([
    getProfile(user.id),
    countUserPrdDocuments(user.id),
  ]);

  return (
    <SubscriptionClient
      userEmail={user.email ?? "User"}
      initialPlan={profile?.plan ?? "free"}
      initialPrdCount={prdCount}
    />
  );
}
