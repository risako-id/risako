"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function tambahKemasan(fd: FormData) {
  const name = String(fd.get("name") || "").trim();
  if (!name) return;
  const { data: store } = await supabaseServer.from("stores").select("id").limit(1).single();
  if (!store) throw new Error("Toko belum disetup.");
  const store_id = store.id;

  const { data: pm, error } = await supabaseServer.from("packaging_materials").insert({
    store_id, name, unit: String(fd.get("unit") || "").trim(), avg_cost: 0, min_stock: Number(fd.get("min_stock") || 0),
  }).select("id").single();
  if (error) throw new Error(error.message);

  const qty = Number(fd.get("stock_qty") || 0);
  if (qty > 0) {
    await supabaseServer.from("packaging_movements").insert({ packaging_material_id: pm.id, movement_type: "in", qty_change: qty, note: "Stok awal" });
  }
  revalidatePath("/kemasan");
}

export async function koreksiStokKemasan(fd: FormData) {
  const id = String(fd.get("id"));
  const qty_fisik = Number(fd.get("qty_fisik") || 0);
  const alasan = String(fd.get("alasan") || "").trim();
  if (!id || !alasan) return;

  const { data: pm } = await supabaseServer.from("packaging_materials").select("stock_qty").eq("id", id).single();
  if (!pm) throw new Error("Barang tidak ditemukan.");
  const selisih = qty_fisik - Number(pm.stock_qty);
  if (selisih === 0) return; 

  await supabaseServer.from("packaging_movements").insert({
    packaging_material_id: id, movement_type: "adjustment", qty_change: selisih,
    note: `Koreksi Fisik: ${alasan} (Sistem: ${pm.stock_qty} -> Fisik: ${qty_fisik})`
  });
  revalidatePath("/kemasan");
}

export async function editKemasan(fd: FormData) {
  const id = String(fd.get("id"));
  const name = String(fd.get("name") || "").trim();
  const unit = String(fd.get("unit") || "").trim();
  const min_stock = Number(fd.get("min_stock") || 0);
  if (!id || !name || !unit) return;

  await supabaseServer.from("packaging_materials").update({ name, unit, min_stock }).eq("id", id);
  revalidatePath("/kemasan");
}

export async function hapusKemasan(id: string) {
  try {
    const { count } = await supabaseServer.from("recipe_packagings").select("*", { count: 'exact', head: true }).eq("packaging_material_id", id);
    if (count && count > 0) return { error: "Gagal hapus: Kemasan sudah masuk dalam Resep Packing." };

    const { count: mutCount } = await supabaseServer.from("packaging_movements").select("*", { count: 'exact', head: true }).eq("packaging_material_id", id);
    if (mutCount && mutCount > 1) return { error: "Gagal hapus: Kemasan sudah ada riwayat transaksi." };

    await supabaseServer.from("packaging_materials").delete().eq("id", id);
    revalidatePath("/kemasan");
    return { success: true };
  } catch (err: any) { return { error: err.message }; }
}
