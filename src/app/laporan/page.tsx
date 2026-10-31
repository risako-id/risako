import { supabaseServer } from "@/lib/supabase-server";
import { getCurrentRole } from "@/lib/auth/role";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LaporanPage() {
  // SATPAM: Hanya Owner yang boleh melihat laporan keuangan
  const role = await getCurrentRole();
  if (role !== "owner") redirect("/");

  // Ambil semua pesanan beserta item dan platformnya
  const { data: orders } = await supabaseServer
    .from("orders")
    .select(`
      id, external_order_id, created_at, status,
      platforms (name),
      order_items (quantity, unit_price, historical_cost, skus (sku_code, products(name)))
    `)
    .order("created_at", { ascending: false });

  let totalOmzet = 0;
  let totalHpp = 0;

  // Hitung total Omzet dan HPP dari semua pesanan
  const reportData = (orders || []).map(order => {
    let orderOmzet = 0;
    let orderHpp = 0;

    order.order_items?.forEach((item: any) => {
      orderOmzet += item.quantity * Number(item.unit_price);
      orderHpp += item.quantity * Number(item.historical_cost);
    });

    totalOmzet += orderOmzet;
    totalHpp += orderHpp;

    return {
      ...order,
      orderOmzet,
      orderHpp,
      orderProfit: orderOmzet - orderHpp
    };
  });

  const grossProfit = totalOmzet - totalHpp;

  return (
    <div>
      <h1>Laporan Laba Kotor</h1>
      <p style={{ color: '#666', marginTop: '-10px' }}>Ringkasan pendapatan dari seluruh transaksi (Online & Offline).</p>

      {/* KARTU RINGKASAN */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px', marginTop: '20px' }}>
        <div className="card" style={{ borderLeft: '4px solid #1565c0', margin: 0 }}>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Total Omzet</p>
          <h2 style={{ margin: '5px 0 0 0', color: '#1565c0' }}>Rp {totalOmzet.toLocaleString('id-ID')}</h2>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #c62828', margin: 0 }}>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Total HPP (Modal)</p>
          <h2 style={{ margin: '5px 0 0 0', color: '#c62828' }}>Rp {totalHpp.toLocaleString('id-ID')}</h2>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #2e7d32', margin: 0 }}>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Laba Kotor</p>
          <h2 style={{ margin: '5px 0 0 0', color: '#2e7d32' }}>Rp {grossProfit.toLocaleString('id-ID')}</h2>
        </div>
      </div>

      <h2>Rincian Transaksi</h2>
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Platform</th>
              <th>Produk</th>
              <th>Qty</th>
              <th>Omzet (Rp)</th>
              <th>HPP (Rp)</th>
              <th>Laba Kotor (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((order) => (
              <tr key={order.id}>
                <td>{new Date(order.created_at).toLocaleDateString('id-ID')}</td>
                <td><span style={{ fontSize: '0.8rem', background: '#eee', padding: '2px 6px', borderRadius: '4px', textTransform: 'capitalize' }}>{(order.platforms as any)?.name}</span></td>
                <td>
                  {order.order_items?.map((item: any, i: number) => (
                    <div key={i}>{item.skus?.products?.name} <small>({item.skus?.sku_code})</small></div>
                  ))}
                </td>
                <td>{order.order_items?.[0]?.quantity}</td>
                <td style={{ color: '#1565c0' }}>{order.orderOmzet.toLocaleString('id-ID')}</td>
                <td style={{ color: '#c62828' }}>{order.orderHpp.toLocaleString('id-ID')}</td>
                <td style={{ color: '#2e7d32', fontWeight: 'bold' }}>{order.orderProfit.toLocaleString('id-ID')}</td>
              </tr>
            ))}
            {reportData.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: '#888' }}>Belum ada data penjualan.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
