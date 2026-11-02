"use server";
import { createAuthServerClient } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";

export async function gantiPassword(prevState: any, formData: FormData) {
  const password = String(formData.get("password") || "").trim();
  const confirm = String(formData.get("confirm") || "").trim();

  if (!password || password.length < 6) {
    return { error: "Password minimal 6 karakter." };
  }
  if (password !== confirm) {
    return { error: "Konfirmasi password tidak cocok." };
  }

  const supabase = await createAuthServerClient();
  
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "Gagal mengganti password: " + error.message };
  }

  return { success: true, message: "Password berhasil diganti!" };
}
