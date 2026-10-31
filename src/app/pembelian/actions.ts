"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function catatPembelian(fd: FormData) {
  const item_type = String(fd.get("item_type")); // 'raw_material' atau 'packaging'
  const item_id = String(fd.get("item_id"));
  const qty = Number(fd.get("qty") || 0);
  const total_price = Number(fd.get("total_price") || 0);
  const note = String(fd.get("note") || "").trim();
  const cash_account_id = String(fd.get("cash_account_id"));
  const source_fund = String(fd.get("source_fund")); // 'cash' atau 'owner_loan'

  if (!item_type || !item_id || qty <= 0 || total_price <= 0 || !cash_account_id || !source_fund) return;

  const { data: store } = await supabaseServer.from("stores").select("id").limit(1).single();
  if (!store) throw new Error("Toko belum disetup.");

  // 1. Catat ke tabel Purchases (Riwayat Belanja)
  await supabaseServer.from("purchases").insert({
    store_id: store.id, item_type, item_id, qty, total_price, note: note || "Pembelian Barang"
  });

  // 2. Jika pakai Uang Pribadi (Owner Loan)
  if (source_fund === "owner_loan") {
    // Catat Utang Toko ke Owner
    await supabaseServer.from("owner_loans").insert({
      store_id: store.id,
      amount: total_price,
      note: `Pinjaman untuk beli: ${note || "barang"}`
    });
    
    // Catat Uang Masuk ke Dompet (Suntik Dana)
    await supabaseServer.from("cash_transactions").insert({
      store_id: store.id,
      cash_account_id,
      type: "in",
      category: "owner_loan",
      amount: total_price,
      description: `Suntik Dana Owner untuk: ${note || "pembelian"}`
    });
  }

  // 3. Catat Uang Keluar dari Dompet (Bayar Supplier)
  await supabaseServer.from("cash_transactions").insert({
    store_id: store.id,
    cash_account_id,
    type: "out",
    category: item_type, 
    amount: total_price,
    description: `Beli ${note || "barang"}`
  });

  const unit_cost = total_price / qty;

  // 4. Tambah Stok & Update Harga Rata-rata
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

  revalidatePath("/pembelian");
  revalidatePath("/bahan-baku");
  revalidatePath("/kemasan");
  revalidatePath("/keuangan");
  revalidatePath("/dompet");
}
