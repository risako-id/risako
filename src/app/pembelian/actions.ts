"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function catatPembelian(fd: FormData) {
  const item_type = String(fd.get("item_type"));
  const item_id = String(fd.get("item_id"));
  const supplier_id = String(fd.get("supplier_id"));
  const qty = Number(fd.get("qty") || 0);
  const total_price = Number(fd.get("total_price") || 0);
  const note = String(fd.get("note") || "").trim();
  const payment_method = String(fd.get("payment_method")); 
  const due_date = String(fd.get("due_date") || "");

  if (!item_type || !item_id || !supplier_id || qty <= 0 || total_price <= 0 || !payment_method) return;

  const { data: store } = await supabaseServer.from("stores").select("id").limit(1).single();
  if (!store) throw new Error("Toko belum disetup.");

  // 1. Cek tipe dompet yang dipilih
  const { data: account } = await supabaseServer.from("cash_accounts").select("type").eq("id", payment_method).single();
  const isKredit = account?.type === "liability";

  // 2. Tentukan status pembayaran
  // Jika isKredit, tidak ada uang yang keluar dari Kas/Bank. Tapi status transaksi 'paid' (karena barang sudah didapat).
  // Kita anggap kreditur sudah membayar lunas ke supplier.
  
  const { data: purchase, error: errPurchase } = await supabaseServer
    .from("purchases")
    .insert({
      store_id: store.id, item_type, item_id, supplier_id, qty, total_price,
      note: note || "Pembelian Barang", payment_status: "paid" 
    })
    .select("id").single();
  if (errPurchase) throw new Error(errPurchase.message);

  // 3. Update Stok
  const unit_cost = total_price / qty;
  if (item_type === "raw_material") {
    await supabaseServer.from("raw_material_movements").insert({ raw_material_id: item_id, movement_type: "in", qty_change: qty, note: "Pembelian" });
    await supabaseServer.from("raw_materials").update({ avg_cost: unit_cost }).eq("id", item_id);
  } else {
    await supabaseServer.from("packaging_movements").insert({ packaging_material_id: item_id, movement_type: "in", qty_change: qty, note: "Pembelian" });
    await supabaseServer.from("packaging_materials").update({ avg_cost: unit_cost }).eq("id", item_id);
  }

  // 4. Catat Uang / Utang
  if (isKredit) {
    // SKENARIO A: Beli pakai Owner Loan / Kredit BCA
    // Uang Kas Aman. Utang bertambah (trigger DB otomatis menambah saldo dompet liability)
    await supabaseServer.from("cash_transactions").insert({
      store_id: store.id, 
      cash_account_id: payment_method, 
      type: "out", // 'out' di liability artinya utang bertambah
      category: "purchase", 
      amount: total_price, 
      description: `Beli ${note || "barang"} via Kredit`
    });
    
    // Opsional: Jika ada tanggal jatuh tempo, kita juga simpan datanya di masa depan untuk pengingat tagihan kredit.
  } else {
    // SKENARIO B: Beli Lunas pakai Kas/Bank
    // Uang Kas Berkurang (trigger DB otomatis mengurangi saldo dompet aset)
    await supabaseServer.from("cash_transactions").insert({
      store_id: store.id, 
      cash_account_id: payment_method, 
      type: "out", 
      category: item_type, 
      amount: total_price, 
      description: `Beli ${note || "barang"} via ${isKredit ? 'Kredit' : 'Kas'}`
    });
  }

  revalidatePath("/pembelian");
  revalidatePath("/bahan-baku");
  revalidatePath("/kemasan");
  revalidatePath("/dompet");
}
