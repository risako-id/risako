"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function catatOwnerLoan(fd: FormData) {
  const amount = Number(fd.get("amount") || 0);
  const note = String(fd.get("note") || "").trim();
  const cash_account_id = String(fd.get("cash_account_id") || "");
  if (amount <= 0 || !cash_account_id) return;

  const { data: store } = await supabaseServer.from("stores").select("id").limit(1).single();
  if (!store) throw new Error("Toko belum disetup.");

  await supabaseServer.from("owner_loans").insert({
    store_id: store.id, amount, note: note || "Pinjaman Owner",
  });

  await supabaseServer.from("cash_transactions").insert({
    store_id: store.id, cash_account_id, type: "in", category: "owner_loan", amount,
    description: `Setoran Pinjaman: ${note}`,
  });

  revalidatePath("/keuangan");
  revalidatePath("/dompet");
}

export async function catatPengeluaran(fd: FormData) {
  const amount = Number(fd.get("amount") || 0);
  const category = String(fd.get("category") || "opex").trim();
  const note = String(fd.get("note") || "").trim();
  const cash_account_id = String(fd.get("cash_account_id") || "");
  const source_fund = String(fd.get("source_fund") || "cash"); // <-- Baru

  if (amount <= 0 || !cash_account_id) return;

  const { data: store } = await supabaseServer.from("stores").select("id").limit(1).single();
  if (!store) throw new Error("Toko belum disetup.");

  // Jika pakai Uang Pribadi (Owner Loan)
  if (source_fund === "owner_loan") {
    // 1. Catat Utang Owner
    await supabaseServer.from("owner_loans").insert({
      store_id: store.id, amount, note: `Pinjaman untuk: ${note || category}`,
    });
    // 2. Catat Uang Masuk (Suntik Dana)
    await supabaseServer.from("cash_transactions").insert({
      store_id: store.id, cash_account_id, type: "in", category: "owner_loan", amount,
      description: `Suntik Dana Owner untuk: ${note || category}`,
    });
  }

  // 3. Catat Uang Keluar (Bayar Pengeluaran)
  await supabaseServer.from("cash_transactions").insert({
    store_id: store.id, cash_account_id, type: "out", category, amount,
    description: note || "Pengeluaran Operasional",
  });

  revalidatePath("/keuangan");
  revalidatePath("/dompet");
}
