import { supabaseServer } from "@/lib/supabase-server";
import { bayarHutang } from "./actions";
import FormBayarHutang from "@/components/hutang/FormBayarHutang";
import { getCurrentRole } from "@/lib/auth/role";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HutangPage() {
  const role = await getCurrentRole();
  if (role !== "owner") redirect("/");

  const { data: cashAccounts } = await supabaseServer.from("cash_accounts").select("id, name").order("name");

  const { data: debts } = await supabaseServer
    .from("supplier_debts")
    .select(`
      id, total_amount, paid_amount, remaining_amount, due_date, status, created_at,
      suppliers (name),
      purchases (note, item_type)
    `)
    .neq("status", "paid") // Hanya tampilkan yang belum lunas
    .order("due_date", { ascending: true });

  return (
    <div>
      <h1>Hutang Supplier</h1>
      <p style={{ color: '#666', marginTop: '-10px' }}>Daftar tagihan supplier yang belum lunas.</p>

      <div className="card" style={{ padding: 0, marginTop: '20px', overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Tgl Transaksi</th>
              <th>Supplier</th>
              <th>Keterangan</th>
              <th>Total Hutang</th>
              <th>Sisa Hutang</th>
              <th>Jatuh Tempo</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {debts?.map((d) => {
              const isOverdue = new Date(d.due_date) < new Date() && d.status !== 'paid';
              return (
                <tr key={d.id}>
                  <td>{new Date(d.created_at).toLocaleDateString('id-ID')}</td>
                  <td><strong>{(d.suppliers as any)?.name}</strong></td>
                  <td>{(d.purchases as any)?.note}</td>
                  <td>Rp {Number(d.total_amount).toLocaleString('id-ID')}</td>
                  <td style={{ color: '#c62828', fontWeight: 'bold' }}>Rp {Number(d.remaining_amount).toLocaleString('id-ID')}</td>
                  <td style={{ color: isOverdue ? '#c62828' : 'inherit', fontWeight: isOverdue ? 'bold' : 'normal' }}>
                    {new Date(d.due_date).toLocaleDateString('id-ID')} {isOverdue && "(Lewat)"}
                  </td>
                  <td>
                    <span style={{ background: d.status === 'partial' ? '#fff3e0' : '#ffebee', color: d.status === 'partial' ? '#e65100' : '#c62828', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                      {d.status === 'partial' ? 'Dicicil' : 'Belum Bayar'}
                    </span>
                  </td>
                  <td>
                    <FormBayarHutang action={bayarHutang} debt={d} cashAccounts={cashAccounts || []} />
                  </td>
                </tr>
              );
            })}
            {(!debts || debts.length === 0) && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>Tidak ada hutang supplier. Semua lunas!</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
