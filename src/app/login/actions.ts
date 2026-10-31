"use server";

import { createAuthServerClient } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export async function login(prevState: any, formData: FormData) {
  const username = String(formData.get("username") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();

  if (!username || !password) {
    return { error: "Username dan password wajib diisi." };
  }

  // TRIK: Ubah username menjadi email fiktif
  const email = `${username}@risako.local`;

  const supabase = await createAuthServerClient();
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Username atau password salah." };
  }

  redirect("/");
}

export async function logout() {
  const supabase = await createAuthServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
