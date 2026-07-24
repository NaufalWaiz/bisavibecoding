/** Client Supabase untuk Client Component (browser). Hanya memakai anon key. */
import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

export function createClient() {
  return createBrowserClient(
    publicEnv.supabaseUrl(),
    publicEnv.supabaseAnonKey(),
  );
}
