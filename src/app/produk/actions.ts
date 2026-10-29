"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function tambahProduk(fd: FormData) {
  const name = String(fd.get("name") || "").trim();
  const sku_code = String(fd.get("sku_code") || "").trim();
  if (!name || !sku_code) return;
  const qty = Number(fd.get("qty") || 0);

  const { data: p, error } = await supabaseServer.from("products").insert({ name }).select("id").single();
  if (error || !p) throw new Error(error?.message);
  
  const { data: s, error: e2 } = await supabaseServer
    .from("skus")
    .insert({
      product_id: p.id,
      sku_code,
      variant_name: String(fd.get("variant_name") || "").trim() || null,
      cost_price: Number(fd.get("cost_price") || 0),
      sell_price: Number(fd.get("sell_price") || 0),
      min_stock: Number(fd.get("min_stock") || 0),
    })
    .select("id")
    .single();
    
  if (e2 || !s) throw new Error(e2?.message);
  
  if (qty > 0)
    await supabaseServer.from("stock_movements").insert({ sku_id: s.id, movement_type: "in", qty_change: qty, note: "Stok awal" });
  
  revalidatePath("/produk");
}

export async function ubahStok(fd: FormData) {
  const sku_id = String(fd.get("sku_id"));
  const jenis = String(fd.get("jenis")); // "in" atau "adjustment"
  const raw = Number(fd.get("qty") || 0);
  if (!sku_id || !raw) return;
  const qty_change = jenis === "in" ? Math.abs(raw) : raw; // koreksi boleh minus
  
  const { error } = await supabaseServer
    .from("stock_movements")
    .insert({ sku_id, movement_type: jenis, qty_change, note: jenis === "in" ? "Barang masuk" : "Koreksi manual" });
    
  if (error) throw new Error(error.message);
  revalidatePath("/produk");
}
