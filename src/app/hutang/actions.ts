"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function bayarHutang(fd: FormData) {
  const debt_id = String(fd.get("debt_id"));
  const amount = Number(fd.get("amount") || 0);
  const cash_account_id = String(fd.get("cash_account_id"));
  const note = String(fd.get("note") || "").trim();

  if (!debt_id || amount <= 0 || !cash_account_id) return;

  // 1. Ambil data hutang saat ini
  const { data: debt, error: errDebt } = await supabaseServer
    .from("supplier_debts")
    .select("remaining_amount, paid_amount, store_id, supplier_id")
    .eq("id", debt_id)
    .single();

  if (errDebt || !debt) throw new Error("Data hutang tidak ditemukan.");
  if (amount > debt.remaining_amount) throw new Error("Nominal pembayaran melebihi sisa hutang.");

  // 2. Hitung nilai baru
  const new_paid = Number(debt.paid_amount) + amount;
  const new_remaining = Number(debt.remaining_amount) - amount;
  const new_status = new_remaining <= 0 ? "paid" : "partial";

  // 3. Catat riwayat pembayaran hutang
  await supabaseServer.from("debt_payments").insert({
    debt_id,
    amount,
    payment_source_id: cash_account_id,
    note: note || "Pembayaran Hutang"
  });

  // 4. Update tabel hutang supplier
  await supabaseServer.from("supplier_debts").update({
    paid_amount: new_paid,
    remaining_amount: new_remaining,
    status: new_status
  }).eq("id", debt_id);

  // 5. Catat uang keluar dari dompet sumber dana
  await supabaseServer.from("cash_transactions").insert({
    store_id: debt.store_id,
    cash_account_id,
    type: "out",
    category: "supplier_debt",
    amount,
    description: `Bayar Hutang Supplier: ${note}`
  });

  revalidatePath("/hutang");
  revalidatePath("/dompet");
  revalidatePath("/keuangan");
}
