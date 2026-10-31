"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function tambahBahanBaku(fd: FormData) {
  const name = String(fd.get("name") || "").trim();
  if (!name) return;

  const { data: store } = await supabaseServer.from("stores").select("id").limit(1).single();
  if (!store) throw new Error("Toko belum disetup.");
  const store_id = store.id;

  const { data: rm, error } = await supabaseServer
    .from("raw_materials")
    .insert({
      store_id, name,
      unit: String(fd.get("unit") || "").trim(),
      avg_cost: Number(fd.get("avg_cost") || 0),
      min_stock: Number(fd.get("min_stock") || 0),
    })
    .select("id").single();
  if (error) throw new Error(error.message);

  const qty = Number(fd.get("stock_qty") || 0);
  if (qty > 0) {
    await supabaseServer.from("raw_material_movements").insert({
      raw_material_id: rm.id, movement_type: "in", qty_change: qty, note: "Stok awal"
    });
  }
  revalidatePath("/bahan-baku");
}

export async function koreksiStokBahan(fd: FormData) {
  const id = String(fd.get("id"));
  const qty_fisik = Number(fd.get("qty_fisik") || 0);
  const alasan = String(fd.get("alasan") || "").trim();
  if (!id || !alasan) return;

  // 1. Dapatkan stok sistem saat ini
  const { data: rm } = await supabaseServer.from("raw_materials").select("stock_qty").eq("id", id).single();
  if (!rm) throw new Error("Barang tidak ditemukan.");

  // 2. Hitung selisih
  const selisih = qty_fisik - Number(rm.stock_qty);
  if (selisih === 0) return; // Jika sama, tidak perlu catat

  // 3. Catat ke mutasi (Trigger DB akan mengupdate tabel raw_materials)
  await supabaseServer.from("raw_material_movements").insert({
    raw_material_id: id,
    movement_type: "adjustment",
    qty_change: selisih,
    note: `Koreksi Fisik: ${alasan} (Sistem: ${rm.stock_qty} -> Fisik: ${qty_fisik})`
  });

  revalidatePath("/bahan-baku");
}
