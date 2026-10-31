import { supabaseServer } from "@/lib/supabase-server";
import { validasiProduksi } from "./actions";
import FormValidasi from "@/components/validasi/FormValidasi";
import { getCurrentRole } from "@/lib/auth/role";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ValidasiPage() {
  // SATPAM: Hanya Owner dan Penjualan
  const role = await getCurrentRole();
  if (role !== "owner" && role !== "penjualan") redirect("/");

  const { data: penjualData } = await supabaseServer.from("employees").select("id, name").eq("role", "penjualan");
  
  const { data: pendingProductions } = await supabaseServer
    .from("production_orders")
    .select("id, qty_produced, note, created_at, products(name)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (
    <div>
      <h1>Validasi Hasil Produksi</h1>
      <p style={{ color: '#666' }}>Daftar hasil masak dari Tim Produksi yang menunggu pengecekan dan validasi Anda.</p>

      <div className="card" style={{ padding: 0, overflowX: 'auto', marginTop: '20px' }}>
        <table>
          <thead>
            <tr>
              <th>Waktu Masak</th>
              <th>Produk</th>
              <th>Qty Masak</th>
              <th>Catatan Produksi</th>
              <th>Aksi Validasi</th>
            </tr>
          </thead>
          <tbody>
            {pendingProductions?.map((p) => (
              <tr key={p.id}>
                <td>{new Date(p.created_at).toLocaleString('id-ID')}</td>
                <td><strong>{(p.products as any)?.name}</strong></td>
                <td>{p.qty_produced} pcs</td>
                <td>{p.note || "-"}</td>
                <td>
                  <FormValidasi 
                    production_id={p.id} 
                    penjualList={penjualData || []} 
                    action={validasiProduksi} 
                  />
                </td>
              </tr>
            ))}
            {(!pendingProductions || pendingProductions.length === 0) && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>Tidak ada produksi yang menunggu validasi.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
