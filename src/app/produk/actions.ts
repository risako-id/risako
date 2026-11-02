"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function tambahProduk(fd: FormData) {
  const name = String(fd.get("name") || "").trim();
  const sku_code = String(fd.get("sku_code") || "").trim();
  if (!name || !sku_code) return;

  const { data: store } = await supabaseServer.from("stores").select("id").limit(1).single();
  if (!store) throw new Error("Toko belum disetup.");
  const store_id = store.id;

  const { data: p, error: errP } = await supabaseServer
    .from("products").insert({ store_id, name }).select("id").single();
  if (errP) throw new Error(errP.message);

  const { data: s, error: errS } = await supabaseServer
    .from("skus")
    .insert({
      store_id, product_id: p.id, sku_code,
      variant_name: String(fd.get("variant_name") || "").trim() || null,
      cost_price: Number(fd.get("cost_price") || 0),
      sell_price: Number(fd.get("sell_price") || 0),
      min_stock: Number(fd.get("min_stock") || 0),
    })
    .select("id").single();
  if (errS) throw new Error(errS.message);

  const qty = Number(fd.get("stock_qty") || 0);
  if (qty > 0) {
    await supabaseServer.from("stock_movements").insert({
      sku_id: s.id, movement_type: "in", qty_change: qty, note: "Stok awal",
    });
  }
  revalidatePath("/produk");
}

export async function editProduk(fd: FormData) {
  const id = String(fd.get("id"));
  const name = String(fd.get("name") || "").trim();
  const sku_code = String(fd.get("sku_code") || "").trim();
  if (!id || !name || !sku_code) return;

  // Update nama produk (tabel products)
  const { data: sku } = await supabaseServer.from("skus").select("product_id").eq("id", id).single();
  if (sku?.product_id) {
    await supabaseServer.from("products").update({ name }).eq("id", sku.product_id);
  }

  // Update detail SKU (tabel skus)
  await supabaseServer.from("skus").update({
    sku_code,
    variant_name: String(fd.get("variant_name") || "").trim() || null,
    cost_price: Number(fd.get("cost_price") || 0),
    sell_price: Number(fd.get("sell_price") || 0),
    min_stock: Number(fd.get("min_stock") || 0),
  }).eq("id", id);

  revalidatePath("/produk");
}

export async function hapusProduk(id: string) {
  try {
    // Cek apakah SKU ini pernah dipakai di order_items
    const { count } = await supabaseServer
      .from("order_items")
      .select("*", { count: 'exact', head: true })
      .eq("sku_id", id);
      
    if (count && count > 0) {
      return { error: "Gagal hapus: Produk sudah pernah terjual." };
    }

    // Cek apakah pernah dipakai di production (lewat relasi product_id)
    const { data: sku } = await supabaseServer.from("skus").select("product_id").eq("id", id).single();
    if (sku?.product_id) {
      const { count: prodCount } = await supabaseServer
        .from("production_orders")
        .select("*", { count: 'exact', head: true })
        .eq("product_id", sku.product_id);
      
      if (prodCount && prodCount > 0) {
        return { error: "Gagal hapus: Produk sudah pernah diproduksi." };
      }
      // Hapus produk induk (SKU akan terhapus otomatis karena ON DELETE CASCADE)
      await supabaseServer.from("products").delete().eq("id", sku.product_id);
    }
    revalidatePath("/produk");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
