import { supabaseServer } from "@/lib/supabase-server";
import { tambahResepBahan, tambahResepKemasan } from "./actions";
import FormResep from "@/components/resep/FormResep";

export const dynamic = "force-dynamic";

export default async function ResepPage() {
  // Ambil data untuk dropdown
  const [skusRes, rmRes, pkgRes] = await Promise.all([
    supabaseServer.from("skus").select("id, sku_code, products(name)"),
    supabaseServer.from("raw_materials").select("id, name"),
    supabaseServer.from("packaging_materials").select("id, name"),
  ]);

  const skus = (skusRes.data || []).map(s => ({ 
    id: s.id, 
    name: (s.products as any)?.name || "Unknown", 
    sku_code: s.sku_code 
  }));

  return (
    <div>
      <h1>Manajemen Resep (BOM)</h1>
      <p style={{ color: '#666' }}>Tentukan bahan baku dan kemasan yang dibutuhkan untuk setiap produk.</p>
      
      <FormResep 
        skus={skus}
        rawMaterials={rmRes.data || []}
        packagings={pkgRes.data || []}
        addBahanAction={tambahResepBahan}
        addKemasanAction={tambahResepKemasan}
      />
      
      <div className="card" style={{ marginTop: '20px' }}>
        <h3>Catatan:</h3>
        <p>Setelah Anda meracik resep di sini, sistem akan otomatis memotong Bahan Baku (Puyuh, Bumbu) saat Anda melakukan Produksi, dan memotong Kemasan (Box) saat barang terjual.</p>
      </div>
    </div>
  );
}
