"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function tambahSupplier(fd: FormData) {
  const name = String(fd.get("name") || "").trim();
  const contact = String(fd.get("contact") || "").trim();
  
  if (!name) return;

  const { data: store } = await supabaseServer.from("stores").select("id").limit(1).single();
  if (!store) throw new Error("Toko belum disetup.");

  const { error } = await supabaseServer.from("suppliers").insert({
    store_id: store.id,
    name,
    contact
  });

  if (error) throw new Error(error.message);
  revalidatePath("/supplier");
}
