"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function tambahKemasan(fd: FormData) {
  const name = String(fd.get("name") || "").trim();
  if (!name) return;

  const { data: store } = await supabaseServer.from("stores").select("id").limit(1).single();
  if (!store) throw new Error("Toko belum disetup.");
  const store_id = store.id;

  const { data: pm, error } = await supabaseServer
    .from("packaging_materials")
    .insert({
      store_id,
      name,
      unit: String(fd.get("unit") || "").trim(), // ex: pcs, roll
      avg_cost: Number(fd.get("avg_cost") || 0),
      min_stock: Number(fd.get("min_stock") || 0),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const qty = Number(fd.get("stock_qty") || 0);
  if (qty > 0) {
    await supabaseServer.from("packaging_movements").insert({
      packaging_material_id: pm.id,
      movement_type: "in",
      qty_change: qty,
      note: "Stok awal",
    });
  }

  revalidatePath("/kemasan");
}
