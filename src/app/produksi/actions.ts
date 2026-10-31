"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function catatProduksi(fd: FormData) {
  const sku_id = String(fd.get("sku_id"));
  const employee_id = String(fd.get("employee_id")); // <-- Tambahan baru
  const qty_produced = Number(fd.get("qty_produced") || 0);
  const note = String(fd.get("note") || "").trim();
  
  if (!sku_id || !employee_id || qty_produced <= 0) return;

  const { data: store } = await supabaseServer.from("stores").select("id").limit(1).single();
  if (!store) throw new Error("Toko belum disetup.");
  
  const { data: skuData } = await supabaseServer.from("skus").select("product_id").eq("id", sku_id).single();
  if (!skuData) throw new Error("Produk tidak ditemukan.");

  const { error } = await supabaseServer.from("production_orders").insert({
    store_id: store.id,
    product_id: skuData.product_id,
    employee_id, // <-- Simpan ID Karyawan
    qty_produced,
    note: note || "Produksi Harian",
  });

  if (error) throw new Error(error.message);
  revalidatePath("/produksi");
  revalidatePath("/produk");
  revalidatePath("/validasi");
}
