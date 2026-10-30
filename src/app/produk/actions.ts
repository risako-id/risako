"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function tambahProduk(fd: FormData) {
  const name = String(fd.get("name") || "").trim();
  const sku_code = String(fd.get("sku_code") || "").trim();
  if (!name || !sku_code) return;

  // Karena baru 1 toko, kita hardcode store_id pertama (Toko Utama)
  const { data: store } = await supabaseServer.from("stores").select("id").limit(1).single();
  if (!store) throw new Error("Toko belum disetup di database.");
  const store_id = store.id;

  const { data: p, error: errP } = await supabaseServer
    .from("products")
    .insert({ store_id, name })
    .select("id")
    .single();
  if (errP) throw new Error(errP.message);

  const { data: s, error: errS } = await supabaseServer
    .from("skus")
    .insert({
      store_id,
      product_id: p.id,
      sku_code,
      variant_name: String(fd.get("variant_name") || "").trim() || null,
      cost_price: Number(fd.get("cost_price") || 0),
      sell_price: Number(fd.get("sell_price") || 0),
      min_stock: Number(fd.get("min_stock") || 0),
    })
    .select("id")
    .single();
  if (errS) throw new Error(errS.message);

  const qty = Number(fd.get("stock_qty") || 0);
  if (qty > 0) {
    await supabaseServer.from("stock_movements").insert({
      sku_id: s.id,
      movement_type: "in",
      qty_change: qty,
      note: "Stok awal (Barang Jadi)",
    });
  }

  revalidatePath("/produk");
}
