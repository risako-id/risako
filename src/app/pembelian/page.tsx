import { supabaseServer } from "@/lib/supabase-server";
import { catatPembelian } from "./actions";
import FormPembelian from "@/components/pembelian/FormPembelian";

export const dynamic = "force-dynamic";

export default async function PembelianPage() {
  const [rmRes, pkgRes, cashRes, supRes] = await Promise.all([
    supabaseServer.from("raw_materials").select("id, name").order("name"),
    supabaseServer.from("packaging_materials").select("id, name").order("name"),
    supabaseServer.from("cash_accounts").select("id, name").order("name"),
    supabaseServer.from("suppliers").select("id, name").order("name"),
  ]);

  const { data: history } = await supabaseServer
    .from("purchases")
    .select("*, suppliers(name)")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div>
      <h1>Pembelian Stok</h1>
      <FormPembelian 
        action={catatPembelian} 
        rawMaterials={rmRes.data || []} 
        packagings={pkgRes.data || []} 
        cashAccounts={cashRes.data || []}
        suppliers={supRes.data || []}
      />

      <h2>Riwayat Pembelian Terakhir</h2>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Supplier</th>
              <th>Keterangan</th>
              <th>Qty</th>
              <th>Total Biaya</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history?.map((h) => (
              <tr key={h.id}>
                <td>{new Date(h.created_at).toLocaleDateString('id-ID')}</td>
                <td>{(h.suppliers as any)?.name || "-"}</td>
                <td>{h.note}</td>
                <td>{h.qty}</td>
                <td style={{ fontWeight: 'bold' }}>Rp {h.total_price.toLocaleString('id-ID')}</td>
                <td>
                  {h.payment_status === 'paid' ? 
                    <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>Lunas</span> : 
                    <span style={{ color: '#c62828', fontWeight: 'bold' }}>Kredit</span>
                  }
                </td>
              </tr>
            ))}
            {(!history || history.length === 0) && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888' }}>Belum ada riwayat pembelian.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
