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

  // Catat Uang Masuk ke Dompet Aset (Kas/Bank)
  // Trigger DB akan menambah saldo dompet
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

  if (amount <= 0 || !cash_account_id) return;

  const { data: store } = await supabaseServer.from("stores").select("id").limit(1).single();
  if (!store) throw new Error("Toko belum disetup.");

  // Catat Uang Keluar dari Dompet
  await supabaseServer.from("cash_transactions").insert({
    store_id: store.id, cash_account_id, type: "out", category, amount,
    description: note || "Pengeluaran Operasional",
  });

  revalidatePath("/keuangan");
  revalidatePath("/dompet");
}

export async function bayarOwnerLoan(fd: FormData) {
  const amount = Number(fd.get("amount") || 0);
  const source_account_id = String(fd.get("source_account_id")); 
  const target_account_id = String(fd.get("target_account_id")); 
  const note = String(fd.get("note") || "").trim();

  if (amount <= 0 || !source_account_id || !target_account_id) return;

  const { data: store } = await supabaseServer.from("stores").select("id").limit(1).single();
  if (!store) throw new Error("Toko belum disetup.");

  // 1. Uang Keluar dari Kas/Bank (Trigger akan mengurangi saldo)
  await supabaseServer.from("cash_transactions").insert({
    store_id: store.id,
    cash_account_id: source_account_id,
    type: "out",
    category: "owner_loan_repayment",
    amount,
    description: note || "Pembayaran Utang ke Owner",
  });

  // 2. Uang Masuk ke Dompet Utang (Trigger akan mengurangi nilai utang)
  await supabaseServer.from("cash_transactions").insert({
    store_id: store.id,
    cash_account_id: target_account_id,
    type: "in",
    category: "owner_loan_repayment",
    amount,
    description: note || "Pelunasan Utang Owner",
  });

  revalidatePath("/keuangan");
  revalidatePath("/dompet");
}
