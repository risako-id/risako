import { supabaseServer } from "@/lib/supabase-server";
import { catatPembelian } from "./actions";
import FormPembelian from "@/components/pembelian/FormPembelian";

export const dynamic = "force-dynamic";

export default async function PembelianPage() {
  const [rmRes, pkgRes, cashRes] = await Promise.all([
    supabaseServer.from("raw_materials").select("id, name").order("name"),
    supabaseServer.from("packaging_materials").select("id, name").order("name"),
    supabaseServer.from("cash_accounts").select("id, name").order("name"),
  ]);

  const { data: history } = await supabaseServer
    .from("purchases")
    .select("*")
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
      />

      <h2>Riwayat Pembelian Terakhir</h2>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Keterangan</th>
              <th>Jenis</th>
              <th>Qty</th>
              <th>Total Biaya</th>
            </tr>
          </thead>
          <tbody>
            {history?.map((h) => (
              <tr key={h.id}>
                <td>{new Date(h.created_at).toLocaleString('id-ID')}</td>
                <td>{h.note}</td>
                <td style={{ textTransform: 'capitalize' }}>{h.item_type.replace('_', ' ')}</td>
                <td>{h.qty}</td>
                <td style={{ color: '#c62828', fontWeight: 'bold' }}>Rp {h.total_price.toLocaleString('id-ID')}</td>
              </tr>
            ))}
            {(!history || history.length === 0) && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>Belum ada riwayat pembelian.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
