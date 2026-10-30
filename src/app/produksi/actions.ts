"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function catatProduksi(fd: FormData) {
  const sku_id = String(fd.get("sku_id"));
  const qty_produced = Number(fd.get("qty_produced") || 0);
  const note = String(fd.get("note") || "").trim();
  
  if (!sku_id || qty_produced <= 0) return;

  const { data: store } = await supabaseServer.from("stores").select("id").limit(1).single();
  if (!store) throw new Error("Toko belum disetup.");
  
  // Ambil product_id dari SKU yang dipilih
  const { data: skuData } = await supabaseServer.from("skus").select("product_id").eq("id", sku_id).single();
  if (!skuData) throw new Error("Produk tidak ditemukan.");

  // Insert ke production_orders (Trigger akan otomatis memotong bahan baku & menambah stok jadi)
  const { error } = await supabaseServer.from("production_orders").insert({
    store_id: store.id,
    product_id: skuData.product_id,
    qty_produced,
    note: note || "Produksi Harian",
  });

  if (error) throw new Error(error.message);
  revalidatePath("/produksi");
  revalidatePath("/produk");
}
