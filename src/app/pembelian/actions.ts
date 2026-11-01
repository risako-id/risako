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
  
  const payment_status = String(fd.get("payment_status")); // 'paid' atau 'unpaid'
  const cash_account_id = String(fd.get("cash_account_id") || ""); // Hanya jika paid
  const due_date = String(fd.get("due_date") || ""); // Hanya jika unpaid

  if (!item_type || !item_id || !supplier_id || qty <= 0 || total_price <= 0 || !payment_status) return;

  const { data: store } = await supabaseServer.from("stores").select("id").limit(1).single();
  if (!store) throw new Error("Toko belum disetup.");

  // 1. Catat ke tabel Purchases
  const { data: purchase, error: errPurchase } = await supabaseServer
    .from("purchases")
    .insert({
      store_id: store.id, 
      item_type, 
      item_id, 
      supplier_id,
      qty, 
      total_price, 
      note: note || "Pembelian Barang",
      payment_status
    })
    .select("id")
    .single();
  
  if (errPurchase) throw new Error(errPurchase.message);

  // 2. Update Stok & Harga Rata-rata
  const unit_cost = total_price / qty;
  if (item_type === "raw_material") {
    await supabaseServer.from("raw_material_movements").insert({
      raw_material_id: item_id, movement_type: "in", qty_change: qty, note: "Pembelian"
    });
    await supabaseServer.from("raw_materials").update({ avg_cost: unit_cost }).eq("id", item_id);
  } else {
    await supabaseServer.from("packaging_movements").insert({
      packaging_material_id: item_id, movement_type: "in", qty_change: qty, note: "Pembelian"
    });
    await supabaseServer.from("packaging_materials").update({ avg_cost: unit_cost }).eq("id", item_id);
  }

  // 3. Logika Pembayaran
  if (payment_status === "paid") {
    // Jika Lunas: Catat Uang Keluar dari Dompet yang dipilih
    if (!cash_account_id) throw new Error("Pilih dompet untuk pembayaran lunas.");
    
    await supabaseServer.from("cash_transactions").insert({
      store_id: store.id,
      cash_account_id,
      type: "out",
      category: item_type,
      amount: total_price,
      description: `Beli ${note || "barang"} (Lunas)`
    });
  } else {
    // Jika Kredit: Catat ke Hutang Supplier
    if (!due_date) throw new Error("Pilih tanggal jatuh tempo untuk pembelian kredit.");

    await supabaseServer.from("supplier_debts").insert({
      store_id: store.id,
      purchase_id: purchase.id,
      supplier_id,
      total_amount: total_price,
      paid_amount: 0,
      remaining_amount: total_price,
      due_date,
      status: "unpaid"
    });
  }

  revalidatePath("/pembelian");
  revalidatePath("/bahan-baku");
  revalidatePath("/kemasan");
  revalidatePath("/dompet");
  revalidatePath("/keuangan");
  revalidatePath("/hutang");
}
