import { supabaseServer } from "@/lib/supabase-server";
import { getCurrentRole } from "@/lib/auth/role";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PayrollPage() {
  // SATPAM: Cek Role
  const role = await getCurrentRole();
  if (role !== "owner") redirect("/");

  // ... (Sisa kode payroll sama persis)
  const { data: employees } = await supabaseServer.from("employees").select("*").eq("role", "produksi");
  const { data: productions } = await supabaseServer
    .from("production_orders")
    .select("employee_id, qty_produced, production_wastes(qty)")
    .eq("status", "validated");

  const payrollData = (employees || []).map(emp => {
    const empProductions = (productions || []).filter(p => p.employee_id === emp.id);
    let totalPcsLolos = 0;
    let totalWaste = 0;

    empProductions.forEach(p => {
      const waste = (p.production_wastes as any[])?.reduce((sum, w) => sum + Number(w.qty), 0) || 0;
      totalWaste += waste;
      totalPcsLolos += (p.qty_produced - waste); 
    });

    const totalUpah = totalPcsLolos * emp.commission_rate;

    return { ...emp, totalPcsLolos, totalWaste, totalUpah };
  });

  return (
    <div>
      <h1>Payroll (Rekap Upah Produksi)</h1>
      <div className="card" style={{ padding: 0, marginTop: '20px' }}>
        <table>
          <thead>
            <tr>
              <th>Nama Karyawan</th>
              <th>Tarif / Pcs</th>
              <th>Pcs Lolos QC</th>
              <th>Total Waste</th>
              <th>Total Upah (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {payrollData.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.name}</strong></td>
                <td>Rp {p.commission_rate.toLocaleString('id-ID')}</td>
                <td style={{ color: '#2e7d32', fontWeight: 'bold' }}>{p.totalPcsLolos} pcs</td>
                <td style={{ color: '#c62828' }}>{p.totalWaste} pcs</td>
                <td><strong>Rp {p.totalUpah.toLocaleString('id-ID')}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
