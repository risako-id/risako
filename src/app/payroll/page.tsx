import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function PayrollPage() {
  // 1. Ambil semua karyawan produksi
  const { data: employees } = await supabaseServer.from("employees").select("*").eq("role", "produksi");
  
  // 2. Ambil semua produksi yang SUDAH DIVALIDASI beserta datanya
  const { data: productions } = await supabaseServer
    .from("production_orders")
    .select("employee_id, qty_produced, production_wastes(qty)")
    .eq("status", "validated");

  // 3. Hitung upah per karyawan
  const payrollData = (employees || []).map(emp => {
    // Filter produksi milik karyawan ini
    const empProductions = (productions || []).filter(p => p.employee_id === emp.id);
    
    let totalPcsLolos = 0;
    let totalWaste = 0;

    empProductions.forEach(p => {
      // Hitung total waste di produksi ini
      const waste = (p.production_wastes as any[])?.reduce((sum, w) => sum + Number(w.qty), 0) || 0;
      totalWaste += waste;
      totalPcsLolos += (p.qty_produced - waste); // Hanya hitung yang lolos QC
    });

    const totalUpah = totalPcsLolos * emp.commission_rate;

    return {
      ...emp,
      totalPcsLolos,
      totalWaste,
      totalUpah
    };
  });

  return (
    <div>
      <h1>Payroll (Rekap Upah Produksi)</h1>
      <p style={{ color: '#666' }}>Perhitungan upah berdasarkan hasil produksi yang telah lolos validasi QC (dikurangi waste).</p>

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
            {payrollData.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>Belum ada data karyawan produksi.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
