"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/db/queries/profiles";

export type AuthState = { error: string | null };

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    next: String(formData.get("next") ?? "/projects"),
  };
}

function validate(email: string, password: string): string | null {
  if (!email || !email.includes("@")) return "Email tidak valid.";
  if (password.length < 8) return "Password minimal 8 karakter.";
  return null;
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const { email, password, next } = readCredentials(formData);
  const invalid = validate(email, password);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return { error: error.message };

  if (data.user) {
    // Jaring pengaman kalau trigger profile belum terpasang.
    try {
      await ensureProfile(data.user.id, data.user.email ?? email);
    } catch (profileError) {
      // Jangan blokir login hanya karena sinkronisasi profil gagal — tapi jangan
      // ditelan diam-diam: kegagalan di sini hampir selalu berarti DATABASE_URL
      // salah atau migrasi belum dijalankan, dan itu akan menjatuhkan /projects.
      console.error(
        "[auth] ensureProfile gagal saat login — cek DATABASE_URL & `npm run db:migrate`:",
        profileError,
      );
    }
  }

  revalidatePath("/", "layout");
  redirect(next.startsWith("/") ? next : "/projects");
}

export async function register(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const { email, password } = readCredentials(formData);
  const invalid = validate(email, password);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };

  // Kalau konfirmasi email diaktifkan, belum ada sesi — arahkan ke login.
  if (!data.session) {
    return {
      error:
        "Akun dibuat. Cek email untuk konfirmasi, lalu masuk lewat halaman login.",
    };
  }

  if (data.user) {
    try {
      await ensureProfile(data.user.id, data.user.email ?? email);
    } catch (profileError) {
      // Trigger DB tetap jadi jalur utama pembuatan profile.
      console.error(
        "[auth] ensureProfile gagal saat register — cek DATABASE_URL & `npm run db:migrate`:",
        profileError,
      );
    }
  }

  revalidatePath("/", "layout");
  redirect("/projects");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
