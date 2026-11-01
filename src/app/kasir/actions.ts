"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function prosesKasir(fd: FormData) {
  const sku_id = String(fd.get("sku_id"));
  const qty = Number(fd.get("qty") || 0);
  const cash_account_id = String(fd.get("cash_account_id")); // <-- Dompet Tujuan
  if (!sku_id || qty <= 0 || !cash_account_id) return;

  const { data: store } = await supabaseServer.from("stores").select("id").limit(1).single();
  const { data: platform } = await supabaseServer.from("platforms").select("id").eq("name", "Offline").single();
  if (!store || !platform) throw new Error("Data master belum siap.");

  const { data: sku } = await supabaseServer.from("skus").select("sell_price, cost_price").eq("id", sku_id).single();
  if (!sku) throw new Error("Produk tidak ditemukan.");
  
  const total_amount = sku.sell_price * qty;
  const external_order_id = `POS-${Date.now()}`;

  // 1. Buat Order
  const { data: order, error: errOrder } = await supabaseServer
    .from("orders")
    .insert({
      store_id: store.id,
      platform_id: platform.id,
      external_order_id,
      status: "COMPLETED",
      total_amount: total_amount,
      ordered_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (errOrder) throw new Error(errOrder.message);

  // 2. Catat Item Pesanan
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

  // 3. Potong Stok Produk
  await supabaseServer.from("stock_movements").insert({
    sku_id: sku_id,
    movement_type: "sale",
    qty_change: -qty,
    order_item_id: orderItem.id,
    note: `Penjualan Offline: ${external_order_id}`
  });

  // 4. Catat Uang Masuk ke Dompet TERTENTU
  await supabaseServer.from("cash_transactions").insert({
    store_id: store.id,
    cash_account_id: cash_account_id, // <-- Uang masuk ke dompet ini
    type: "in",
    category: "sale",
    amount: total_amount,
    description: `Penjualan Offline: ${qty} pcs`
  });

  revalidatePath("/kasir");
  revalidatePath("/produk");
  revalidatePath("/dompet");
  revalidatePath("/keuangan");
}
