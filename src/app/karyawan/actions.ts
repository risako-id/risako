"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function tambahKaryawan(fd: FormData) {
  const name = String(fd.get("name") || "").trim();
  const role = String(fd.get("role") || "").trim();
  const commission_rate = Number(fd.get("commission_rate") || 0);
  
  if (!name || !role) return;

  const { data: store } = await supabaseServer.from("stores").select("id").limit(1).single();
  if (!store) throw new Error("Toko belum disetup.");

  const { error } = await supabaseServer.from("employees").insert({
    store_id: store.id,
    name,
    role,
    commission_rate,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/karyawan");
}
