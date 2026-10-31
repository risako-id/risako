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
    .order("created_at", { ascending: true });

  const totalKas = accounts?.reduce((acc, curr) => acc + Number(curr.balance), 0) || 0;

  return (
    <div>
      <h1>Dompet & Rekening Toko</h1>
      <p style={{ color: '#666', marginTop: '-10px' }}>Total Kas Toko: <strong>Rp {totalKas.toLocaleString('id-ID')}</strong></p>

      <FormDompet action={tambahDompet} />

      <h2>Daftar Dompet</h2>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Nama Dompet</th>
              <th>Jenis</th>
              <th>Saldo Saat Ini</th>
            </tr>
          </thead>
          <tbody>
            {accounts?.map((a) => (
              <tr key={a.id}>
                <td><strong>{a.name}</strong></td>
                <td style={{ textTransform: 'capitalize' }}>{a.type}</td>
                <td style={{ color: '#2e7d32', fontWeight: 'bold' }}>
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
