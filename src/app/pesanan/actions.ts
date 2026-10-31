"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function simulasiPesanan(fd: FormData) {
  const sku_id = String(fd.get("sku_id"));
  const qty = Number(fd.get("qty") || 0);
  if (!sku_id || qty <= 0) return;

  // 1. Ambil data Toko & Platform
  const { data: store } = await supabaseServer.from("stores").select("id").limit(1).single();
  const { data: platform } = await supabaseServer.from("platforms").select("id").eq("name", "TikTok").single();
  if (!store || !platform) throw new Error("Data master belum siap.");

  // 2. Buat "Surat Pesanan" (Orders)
  const external_order_id = `SIM-${Date.now()}`; // ID Simulasi
  const { data: order, error: errOrder } = await supabaseServer
    .from("orders")
    .insert({
      store_id: store.id,
      platform_id: platform.id,
      external_order_id,
      status: "AWAITING_SHIPMENT", // Siap Kirim
      ordered_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (errOrder) throw new Error(errOrder.message);

  // 3. Ambil data Produk & Harga
  const { data: sku } = await supabaseServer.from("skus").select("sell_price, cost_price").eq("id", sku_id).single();

  // 4. Catat Item Pesanan (Harga historis)
  const { data: orderItem, error: errItem } = await supabaseServer
    .from("order_items")
    .insert({
      order_id: order.id,
      store_id: store.id,
      sku_id: sku_id,
      quantity: qty,
      unit_price: sku?.sell_price || 0,
      historical_cost: sku?.cost_price || 0
    })
    .select("id")
    .single();
  if (errItem) throw new Error(errItem.message);

  // 5. POTONG STOK PRODUK JADI (Trigger DB akan mengurangi angka stok)
  await supabaseServer.from("stock_movements").insert({
    sku_id: sku_id,
    movement_type: "sale",
    qty_change: -qty,
    order_item_id: orderItem.id,
    note: `Penjualan Online: ${external_order_id}`
  });

  // 6. POTONG STOK KEMASAN (Berdasarkan Resep Packing)
  const { data: packRecipes } = await supabaseServer.from("recipe_packagings").select("packaging_material_id, quantity_needed").eq("sku_id", sku_id);
  
  if (packRecipes && packRecipes.length > 0) {
    for (const pr of packRecipes) {
      await supabaseServer.from("packaging_movements").insert({
        packaging_material_id: pr.packaging_material_id,
        movement_type: "used",
        qty_change: -(pr.quantity_needed * qty),
        order_id: order.id,
        note: `Packing order: ${external_order_id}`
      });
    }
  }

  revalidatePath("/pesanan");
  revalidatePath("/produk");
  revalidatePath("/kemasan");
}
