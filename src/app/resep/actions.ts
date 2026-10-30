"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function tambahResepBahan(fd: FormData) {
  const sku_id = String(fd.get("sku_id"));
  const raw_material_id = String(fd.get("raw_material_id"));
  const quantity_needed = Number(fd.get("quantity_needed") || 0);
  
  if (!sku_id || !raw_material_id || quantity_needed <= 0) return;

  const { error } = await supabaseServer.from("recipes").insert({
    sku_id, raw_material_id, quantity_needed
  });
  if (error) throw new Error(error.message);
  revalidatePath("/resep");
}

export async function tambahResepKemasan(fd: FormData) {
  const sku_id = String(fd.get("sku_id"));
  const packaging_material_id = String(fd.get("packaging_material_id"));
  const quantity_needed = Number(fd.get("quantity_needed") || 0);
  
  if (!sku_id || !packaging_material_id || quantity_needed <= 0) return;

  const { error } = await supabaseServer.from("recipe_packagings").insert({
    sku_id, packaging_material_id, quantity_needed
  });
  if (error) throw new Error(error.message);
  revalidatePath("/resep");
}
