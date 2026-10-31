"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function tambahDompet(fd: FormData) {
  const name = String(fd.get("name") || "").trim();
  const type = String(fd.get("type") || "cash").trim();
  const initial_balance = Number(fd.get("initial_balance") || 0);

  if (!name) return;

  const { data: store } = await supabaseServer.from("stores").select("id").limit(1).single();
  if (!store) throw new Error("Toko belum disetup.");

  // 1. Buat Dompet
  const { data: account, error } = await supabaseServer
    .from("cash_accounts")
    .insert({ store_id: store.id, name, type, balance: initial_balance })
    .select("id").single();
  if (error) throw new Error(error.message);

  // 2. Jika ada saldo awal, catat sebagai transaksi (Owner Loan)
  if (initial_balance > 0) {
    await supabaseServer.from("cash_transactions").insert({
      store_id: store.id,
      cash_account_id: account.id,
      type: "in",
      category: "owner_loan",
      amount: initial_balance,
      description: `Saldo awal ${name}`
    });
    
    // Catat juga ke owner_loans
    await supabaseServer.from("owner_loans").insert({
      store_id: store.id,
      amount: initial_balance,
      note: `Setoran awal untuk ${name}`
    });
  }

  revalidatePath("/dompet");
  revalidatePath("/keuangan");
}
