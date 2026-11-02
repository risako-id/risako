import { supabaseServer } from "@/lib/supabase-server";
import { tambahDompet } from "./actions";
import FormDompet from "@/components/dompet/FormDompet";
import { getCurrentRole } from "@/lib/auth/role";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DompetPage() {
  const role = await getCurrentRole();
  if (role !== "owner") redirect("/");

  const { data: accounts } = await supabaseServer
    .from("cash_accounts")
    .select("*")
    .order("type", { ascending: true })
    .order("created_at", { ascending: true });

  const totalAset = accounts?.filter(a => a.type !== 'liability').reduce((acc, curr) => acc + Number(curr.balance), 0) || 0;
  const totalUtang = accounts?.filter(a => a.type === 'liability').reduce((acc, curr) => acc + Number(curr.balance), 0) || 0;

  return (
    <div>
      <h1>Dompet & Akun Kredit</h1>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div className="card" style={{ flex: 1, borderLeft: '4px solid #2e7d32' }}>
          <p style={{ margin: 0, color: '#666' }}>Total Uang Fisik (Aset)</p>
          <h2 style={{ margin: '5px 0 0 0', color: '#2e7d32' }}>Rp {totalAset.toLocaleString('id-ID')}</h2>
        </div>
        <div className="card" style={{ flex: 1, borderLeft: '4px solid #c62828' }}>
          <p style={{ margin: 0, color: '#666' }}>Total Utang (Liabilitas)</p>
          <h2 style={{ margin: '5px 0 0 0', color: '#c62828' }}>Rp {totalUtang.toLocaleString('id-ID')}</h2>
        </div>
      </div>

      <FormDompet action={tambahDompet} />

      <h2>Daftar Dompet</h2>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Tipe</th>
              <th>Saldo / Utang</th>
            </tr>
          </thead>
          <tbody>
            {accounts?.map((a) => (
              <tr key={a.id}>
                <td><strong>{a.name}</strong></td>
                <td style={{ textTransform: 'capitalize' }}>{a.type === 'liability' ? 'Utang / Kredit' : 'Aset / Uang'}</td>
                <td style={{ color: a.type === 'liability' ? '#c62828' : '#2e7d32', fontWeight: 'bold' }}>
                  Rp {Number(a.balance).toLocaleString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
