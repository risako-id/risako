import { supabaseServer } from "@/lib/supabase-server";
import { hapusResepBahan, hapusResepKemasan } from "./actions";
import FormResep from "@/components/resep/FormResep";
import { getCurrentRole } from "@/lib/auth/role";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ResepPage() {
  const role = await getCurrentRole();
  if (role !== "owner") redirect("/");

  const [skusRes, rmRes, pkgRes, recipeRes, recipePkgRes] = await Promise.all([
    supabaseServer.from("skus").select("id, sku_code, products(name)"),
    supabaseServer.from("raw_materials").select("id, name"),
    supabaseServer.from("packaging_materials").select("id, name"),
    supabaseServer.from("recipes").select("id, quantity_needed, skus(sku_code, products(name)), raw_materials(name, unit)"),
    supabaseServer.from("recipe_packagings").select("id, quantity_needed, skus(sku_code, products(name)), packaging_materials(name, unit)"),
  ]);

  const skus = (skusRes.data || []).map(s => ({ 
    id: s.id, name: (s.products as any)?.name || "Unknown", sku_code: s.sku_code 
  }));

  return (
    <div>
      <h1>Manajemen Resep (BOM)</h1>
      
      <FormResep 
        skus={skus}
        rawMaterials={rmRes.data || []}
        packagings={pkgRes.data || []}
      />

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '30px' }}>
        {/* DAFTAR RESEP DAPUR */}
        <div className="card" style={{ flex: 1, minWidth: '350px', padding: 0 }}>
          <h3 style={{ padding: '15px', margin: 0, borderBottom: '1px solid #eee' }}>Daftar Resep Dapur</h3>
          <table>
            <thead><tr><th>Produk</th><th>Bahan</th><th>Qty</th><th>Aksi</th></tr></thead>
            <tbody>
              {recipeRes.data?.map(r => (
                <tr key={r.id}>
                  <td><strong>{(r.skus as any)?.products?.name}</strong> ({(r.skus as any)?.sku_code})</td>
                  <td>{(r.raw_materials as any)?.name}</td>
                  <td>{r.quantity_needed} {(r.raw_materials as any)?.unit}</td>
                  <td>
                    <form action={async () => { "use server"; await hapusResepBahan(r.id); }}>
                      <button type="submit" style={{ background: '#c62828', padding: '5px 10px', fontSize: '0.8rem' }}>Hapus</button>
                    </form>
                  </td>
                </tr>
              ))}
              {(!recipeRes.data || recipeRes.data.length === 0) && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>Belum ada resep dapur.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* DAFTAR RESEP KEMASAN */}
        <div className="card" style={{ flex: 1, minWidth: '350px', padding: 0 }}>
          <h3 style={{ padding: '15px', margin: 0, borderBottom: '1px solid #eee' }}>Daftar Resep Packing</h3>
          <table>
            <thead><tr><th>Produk</th><th>Kemasan</th><th>Qty</th><th>Aksi</th></tr></thead>
            <tbody>
              {recipePkgRes.data?.map(r => (
                <tr key={r.id}>
                  <td><strong>{(r.skus as any)?.products?.name}</strong> ({(r.skus as any)?.sku_code})</td>
                  <td>{(r.packaging_materials as any)?.name}</td>
                  <td>{r.quantity_needed} {(r.packaging_materials as any)?.unit}</td>
                  <td>
                    <form action={async () => { "use server"; await hapusResepKemasan(r.id); }}>
                      <button type="submit" style={{ background: '#c62828', padding: '5px 10px', fontSize: '0.8rem' }}>Hapus</button>
                    </form>
                  </td>
                </tr>
              ))}
              {(!recipePkgRes.data || recipePkgRes.data.length === 0) && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>Belum ada resep packing.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
