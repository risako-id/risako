"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function validasiProduksi(fd: FormData) {
  const production_id = String(fd.get("production_id"));
  const validator_id = String(fd.get("validator_id"));
  const waste_qty = Number(fd.get("waste_qty") || 0);
  const waste_reason = String(fd.get("waste_reason") || "").trim();

  if (!production_id || !validator_id) return;

  // 1. Ambil data produksi untuk tahu product_id & qty
  const { data: po } = await supabaseServer.from("production_orders").select("product_id, qty_produced").eq("id", production_id).single();
  if (!po) throw new Error("Data produksi tidak ditemukan.");

  // 2. Update status produksi menjadi VALIDATED
  const { error: errUpdate } = await supabaseServer.from("production_orders").update({
    status: 'validated',
    validated_by: validator_id,
    validated_at: new Date().toISOString()
  }).eq("id", production_id);
  
  if (errUpdate) throw new Error(errUpdate.message);

  // 3. Jika ada barang rusak (waste), catat dan potong stok jadi
  if (waste_qty > 0) {
    await supabaseServer.from("production_wastes").insert({
      production_order_id: production_id,
      qty: waste_qty,
      reason: waste_reason || "Tanpa keterangan"
    });

    // Cari SKU dari produk ini untuk memotong stok jadi
    const { data: sku } = await supabaseServer.from("skus").select("id").eq("product_id", po.product_id).limit(1).single();
    
    if (sku) {
      await supabaseServer.from("stock_movements").insert({
        sku_id: sku.id,
        movement_type: "waste",
        qty_change: -waste_qty,
        note: `Waste divalidasi: ${waste_reason}`
      });
    }
  }

  revalidatePath("/validasi");
  revalidatePath("/produksi");
  revalidatePath("/produk");
}
