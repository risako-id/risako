"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function simpanResepBahan(fd: FormData) {
  const sku_id = String(fd.get("sku_id"));
  const raw_material_ids = fd.getAll("raw_material_id[]");
  const quantities = fd.getAll("quantity_needed[]");

  if (!sku_id || raw_material_ids.length === 0) return;

  const inserts = [];
  for (let i = 0; i < raw_material_ids.length; i++) {
    const rm_id = String(raw_material_ids[i]);
    const qty = Number(quantities[i] || 0);
    if (rm_id && qty > 0) {
      inserts.push({ sku_id, raw_material_id: rm_id, quantity_needed: qty });
    }
  }

  if (inserts.length > 0) {
    const { error } = await supabaseServer.from("recipes").insert(inserts);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/resep");
}

export async function simpanResepKemasan(fd: FormData) {
  const sku_id = String(fd.get("sku_id"));
  const packaging_ids = fd.getAll("packaging_material_id[]");
  const quantities = fd.getAll("quantity_needed[]");

  if (!sku_id || packaging_ids.length === 0) return;

  const inserts = [];
  for (let i = 0; i < packaging_ids.length; i++) {
    const pkg_id = String(packaging_ids[i]);
    const qty = Number(quantities[i] || 0);
    if (pkg_id && qty > 0) {
      inserts.push({ sku_id, packaging_material_id: pkg_id, quantity_needed: qty });
    }
  }

  if (inserts.length > 0) {
    const { error } = await supabaseServer.from("recipe_packagings").insert(inserts);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/resep");
}

export async function hapusResepBahan(id: string) {
  await supabaseServer.from("recipes").delete().eq("id", id);
  revalidatePath("/resep");
}

export async function hapusResepKemasan(id: string) {
  await supabaseServer.from("recipe_packagings").delete().eq("id", id);
  revalidatePath("/resep");
}
