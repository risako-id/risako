import { supabaseServer } from "@/lib/supabase-server";
import { catatOwnerLoan, catatPengeluaran, bayarOwnerLoan } from "./actions";
import FormKeuangan from "@/components/keuangan/FormKeuangan";
import FormBayarOwnerLoan from "@/components/keuangan/FormBayarOwnerLoan";
import { getCurrentRole } from "@/lib/auth/role";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function KeuanganPage() {
  const role = await getCurrentRole();
  if (role !== "owner") redirect("/");

  const { data: cashAccounts } = await supabaseServer.from("cash_accounts").select("id, name, type");

  const { data: accounts } = await supabaseServer.from("cash_accounts").select("*");
  const totalKas = accounts?.filter(a => a.type !== 'liability').reduce((acc, curr) => acc + Number(curr.balance), 0) || 0;
  const totalUtang = accounts?.filter(a => a.type === 'liability').reduce((acc, curr) => acc + Number(curr.balance), 0) || 0;

  const { data: history } = await supabaseServer
    .from("cash_transactions")
    .select("*, cash_accounts(name)")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div>
      <h1>Keuangan & Kas Toko</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div className="card" style={{ borderLeft: '4px solid #1565c0', margin: 0 }}>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Total Utang (Owner/Kredit)</p>
          <h2 style={{ margin: '5px 0 0 0', color: '#c62828' }}>Rp {totalUtang.toLocaleString('id-ID')}</h2>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #2e7d32', margin: 0 }}>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Total Kas Gabungan</p>
          <h2 style={{ margin: '5px 0 0 0', color: '#2e7d32' }}>Rp {totalKas.toLocaleString('id-ID')}</h2>
        </div>
      </div>

      <FormKeuangan 
        actionLoan={catatOwnerLoan} 
        actionOpex={catatPengeluaran} 
        cashAccounts={cashAccounts || []} 
      />

      <FormBayarOwnerLoan 
        action={bayarOwnerLoan} 
        cashAccounts={cashAccounts || []} 
      />

      <h2 style={{ marginTop: '30px' }}>Riwayat Transaksi Kas Terakhir</h2>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Keterangan</th>
              <th>Dompet</th>
              <th>Masuk (Rp)</th>
              <th>Keluar (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {history?.map((h) => (
              <tr key={h.id}>
                <td>{new Date(h.created_at).toLocaleDateString('id-ID')}</td>
                <td>{h.description}</td>
                <td>{(h.cash_accounts as any)?.name || "-"}</td>
                <td style={{ color: '#2e7d32', fontWeight: 'bold' }}>{h.type === 'in' ? h.amount.toLocaleString('id-ID') : '-'}</td>
                <td style={{ color: '#c62828', fontWeight: 'bold' }}>{h.type === 'out' ? h.amount.toLocaleString('id-ID') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
