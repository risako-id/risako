"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function prosesKasir(fd: FormData) {
  const sku_id = String(fd.get("sku_id"));
  const qty = Number(fd.get("qty") || 0);
  if (!sku_id || qty <= 0) return;

  // 1. Ambil data Toko & Platform (Offline)
  const { data: store } = await supabaseServer.from("stores").select("id").limit(1).single();
  const { data: platform } = await supabaseServer.from("platforms").select("id").eq("name", "Offline").single();
  if (!store || !platform) throw new Error("Data master belum siap.");

  // 2. Ambil data Produk & Harga
  const { data: sku } = await supabaseServer.from("skus").select("sell_price, cost_price").eq("id", sku_id).single();
  if (!sku) throw new Error("Produk tidak ditemukan.");
  
  const total_amount = sku.sell_price * qty;

  // 3. Buat "Surat Pesanan" (Orders)
  const external_order_id = `POS-${Date.now()}`;
  const { data: order, error: errOrder } = await supabaseServer
    .from("orders")
    .insert({
      store_id: store.id,
      platform_id: platform.id,
      external_order_id,
      status: "COMPLETED", // Langsung selesai karena offline
      total_amount: total_amount,
      ordered_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (errOrder) throw new Error(errOrder.message);

  // 4. Catat Item Pesanan
  const { data: orderItem, error: errItem } = await supabaseServer
    .from("order_items")
    .insert({
      order_id: order.id,
      store_id: store.id,
      sku_id: sku_id,
      quantity: qty,
      unit_price: sku.sell_price,
      historical_cost: sku.cost_price
    })
    .select("id")
    .single();
  if (errItem) throw new Error(errItem.message);

  // 5. POTONG STOK PRODUK JADI
  await supabaseServer.from("stock_movements").insert({
    sku_id: sku_id,
    movement_type: "sale",
    qty_change: -qty,
    order_item_id: orderItem.id,
    note: `Penjualan Offline (Kasir): ${external_order_id}`
  });

  // 6. CATAT UANG MASUK KE KAS TOKO
  await supabaseServer.from("cash_transactions").insert({
    store_id: store.id,
    type: "in",
    category: "sale", // Kategori penjualan
    amount: total_amount,
    description: `Penjualan Offline: ${qty} pcs`
  });

  // *CATATAN: TIDAK ADA INSERT KE packaging_movements (Box tidak dipotong)*

  revalidatePath("/kasir");
  revalidatePath("/produk");
  revalidatePath("/keuangan");
}
