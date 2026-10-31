import { supabaseServer } from "@/lib/supabase-server";
import { catatProduksi } from "./actions";
import FormProduksi from "@/components/produksi/FormProduksi";
import { getCurrentEmployee } from "@/lib/auth/role";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProduksiPage() {
  const currentEmployee = await getCurrentEmployee();
  
  if (currentEmployee?.role !== "owner" && currentEmployee?.role !== "produksi") redirect("/");

  const { data: skusData } = await supabaseServer.from("skus").select("id, sku_code, products(name)");
  const skus = (skusData || []).map(s => ({ id: s.id, name: (s.products as any)?.name, sku_code: s.sku_code }));

  // PERBAIKAN: Ambil karyawan role 'produksi' DAN 'owner'
  const { data: karyawanData } = await supabaseServer
    .from("employees")
    .select("id, name")
    .in("role", ["produksi", "owner"]);

  const { data: history } = await supabaseServer
    .from("production_orders")
    .select("id, qty_produced, note, created_at, status, products(name), employees(name)")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div>
      <h1>Dapur Produksi</h1>
      <FormProduksi 
        action={catatProduksi} 
        skus={skus} 
        karyawan={karyawanData || []} 
        currentEmployee={currentEmployee} 
      />

      <h2>Riwayat Produksi Terakhir</h2>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Juru Masak</th>
              <th>Produk</th>
              <th>Jumlah</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history?.map((h) => (
              <tr key={h.id}>
                <td>{new Date(h.created_at).toLocaleString('id-ID')}</td>
                <td>{(h.employees as any)?.name || "-"}</td>
                <td><strong>{(h.products as any)?.name}</strong></td>
                <td>{h.qty_produced} pcs</td>
                <td>
                  {h.status === 'pending' ? 
                    <span style={{ color: '#f57c00', fontWeight: 'bold' }}>Pending QC</span> : 
                    <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>Validated</span>
                  }
                </td>
              </tr>
            ))}
            {(!history || history.length === 0) && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>Belum ada riwayat produksi.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
