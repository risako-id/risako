"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function catatOwnerLoan(fd: FormData) {
  const amount = Number(fd.get("amount") || 0);
  const note = String(fd.get("note") || "").trim();
  if (amount <= 0) return;

  const { data: store } = await supabaseServer.from("stores").select("id").limit(1).single();
  if (!store) throw new Error("Toko belum disetup.");

  await supabaseServer.from("owner_loans").insert({
    store_id: store.id,
    amount,
    note: note || "Pinjaman Owner",
  });

  await supabaseServer.from("cash_transactions").insert({
    store_id: store.id,
    type: "in",
    category: "owner_loan",
    amount,
    description: `Setoran Pinjaman: ${note}`,
  });

  revalidatePath("/keuangan");
}

export async function catatPengeluaran(fd: FormData) {
  const amount = Number(fd.get("amount") || 0);
  const category = String(fd.get("category") || "opex").trim();
  const note = String(fd.get("note") || "").trim();
  if (amount <= 0) return;

  const { data: store } = await supabaseServer.from("stores").select("id").limit(1).single();
  if (!store) throw new Error("Toko belum disetup.");

  await supabaseServer.from("cash_transactions").insert({
    store_id: store.id,
    type: "out",
    category, 
    amount,
    description: note || "Pengeluaran Operasional",
  });

  revalidatePath("/keuangan");
}
