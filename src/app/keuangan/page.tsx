import { supabaseServer } from "@/lib/supabase-server";
import { catatOwnerLoan, catatPengeluaran } from "./actions";
import FormKeuangan from "@/components/keuangan/FormKeuangan";
import { getCurrentRole } from "@/lib/auth/role";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function KeuanganPage() {
  // SATPAM: Cek Role
  const role = await getCurrentRole();
  if (role !== "owner") redirect("/");

  // ... (Sisa kode keuangan sama persis seperti sebelumnya)
  const { data: loans } = await supabaseServer.from("owner_loans").select("amount");
  const totalLoan = loans?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

  const { data: txs } = await supabaseServer.from("cash_transactions").select("type, amount");
  const totalIn = txs?.filter(t => t.type === 'in').reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
  const totalOut = txs?.filter(t => t.type === 'out').reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
  const saldoKas = totalIn - totalOut;

  const { data: history } = await supabaseServer
    .from("cash_transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div>
      <h1>Keuangan & Kas Toko</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div className="card" style={{ borderLeft: '4px solid #1565c0', margin: 0 }}>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Total Utang ke Owner</p>
          <h2 style={{ margin: '5px 0 0 0' }}>Rp {totalLoan.toLocaleString('id-ID')}</h2>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #2e7d32', margin: 0 }}>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Saldo Kas Toko (Tunai)</p>
          <h2 style={{ margin: '5px 0 0 0' }}>Rp {saldoKas.toLocaleString('id-ID')}</h2>
        </div>
      </div>

      <FormKeuangan actionLoan={catatOwnerLoan} actionOpex={catatPengeluaran} />

      <h2>Riwayat Transaksi Kas Terakhir</h2>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Keterangan</th>
              <th>Kategori</th>
              <th>Masuk (Rp)</th>
              <th>Keluar (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {history?.map((h) => (
              <tr key={h.id}>
                <td>{new Date(h.created_at).toLocaleString('id-ID')}</td>
                <td>{h.description}</td>
                <td><span style={{ fontSize: '0.8rem', background: '#eee', padding: '2px 6px', borderRadius: '4px', textTransform: 'capitalize' }}>{h.category.replace('_', ' ')}</span></td>
                <td style={{ color: '#2e7d32', fontWeight: 'bold' }}>{h.type === 'in' ? h.amount.toLocaleString('id-ID') : '-'}</td>
                <td style={{ color: '#c62828', fontWeight: 'bold' }}>{h.type === 'out' ? h.amount.toLocaleString('id-ID') : '-'}</td>
              </tr>
            ))}
            {(!history || history.length === 0) && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>Belum ada transaksi kas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
