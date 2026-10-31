"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function tambahKaryawan(fd: FormData) {
  const name = String(fd.get("name") || "").trim();
  const username = String(fd.get("username") || "").trim().toLowerCase();
  const role = String(fd.get("role") || "").trim();
  const commission_rate = Number(fd.get("commission_rate") || 0);
  
  if (!name || !username || !role) return;

  const email = `${username}@risako.local`;
  const defaultPassword = "123456"; // Password default untuk karyawan

  // 1. Buat Akun Login di Supabase Auth
  const { error: authError } = await supabaseServer.auth.admin.createUser({
    email,
    password: defaultPassword,
    email_confirm: true // Langsung aktifkan
  });

  if (authError) throw new Error("Gagal membuat akun login: " + authError.message);

  // 2. Simpan data ke tabel employees
  const { data: store } = await supabaseServer.from("stores").select("id").limit(1).single();
  if (!store) throw new Error("Toko belum disetup.");

  const { error } = await supabaseServer.from("employees").insert({
    store_id: store.id,
    name,
    username,
    email,
    role,
    commission_rate,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/karyawan");
}
