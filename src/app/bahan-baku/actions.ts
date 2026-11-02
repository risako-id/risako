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
      avg_cost: 0,
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

  const { data: rm } = await supabaseServer.from("raw_materials").select("stock_qty").eq("id", id).single();
  if (!rm) throw new Error("Barang tidak ditemukan.");

  const selisih = qty_fisik - Number(rm.stock_qty);
  if (selisih === 0) return; 

  await supabaseServer.from("raw_material_movements").insert({
    raw_material_id: id,
    movement_type: "adjustment",
    qty_change: selisih,
    note: `Koreksi Fisik: ${alasan} (Sistem: ${rm.stock_qty} -> Fisik: ${qty_fisik})`
  });

  revalidatePath("/bahan-baku");
}

export async function editBahanBaku(fd: FormData) {
  const id = String(fd.get("id"));
  const name = String(fd.get("name") || "").trim();
  const unit = String(fd.get("unit") || "").trim();
  const min_stock = Number(fd.get("min_stock") || 0);
  if (!id || !name || !unit) return;

  await supabaseServer.from("raw_materials").update({ name, unit, min_stock }).eq("id", id);
  revalidatePath("/bahan-baku");
}

export async function hapusBahanBaku(id: string) {
  try {
    // Cek apakah pernah dipakai di resep
    const { count } = await supabaseServer.from("recipes").select("*", { count: 'exact', head: true }).eq("raw_material_id", id);
    if (count && count > 0) return { error: "Gagal hapus: Bahan sudah masuk dalam Resep (BOM)." };

    // Cek mutasi
    const { count: mutCount } = await supabaseServer.from("raw_material_movements").select("*", { count: 'exact', head: true }).eq("raw_material_id", id);
    if (mutCount && mutCount > 1) return { error: "Gagal hapus: Bahan sudah ada riwayat transaksi." };

    await supabaseServer.from("raw_materials").delete().eq("id", id);
    revalidatePath("/bahan-baku");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
