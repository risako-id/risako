"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function tambahDompet(fd: FormData) {
  const name = String(fd.get("name") || "").trim();
  const type = String(fd.get("type") || "asset").trim(); // Default aset
  const initial_balance = Number(fd.get("initial_balance") || 0);

  if (!name) return;

  const { data: store } = await supabaseServer.from("stores").select("id").limit(1).single();
  if (!store) throw new Error("Toko belum disetup.");

  // Buat Dompet
  const { error } = await supabaseServer
    .from("cash_accounts")
    .insert({ store_id: store.id, name, type, balance: initial_balance });

  if (error) throw new Error(error.message);
  revalidatePath("/dompet");
}
