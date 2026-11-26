import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function PesananPage() {
  const allowedStatuses = [
    'AWAITING_COLLECTION', 
    'IN_TRANSIT', 
    'DELIVERED', 
    'COMPLETED', 
    'RETURNED', 
    'CANCELLED'
  ];

  const { data: orders } = await supabaseServer
    .from("orders")
    .select(`
      id, external_order_id, status, created_at, total_amount,
      order_items (quantity, skus (sku_code, products(name)))
    `)
    .in('status', allowedStatuses) 
    .order("created_at", { ascending: false })
    .limit(50);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  return (
    <div>
      <h1>Pesanan Online</h1>
      <div className="card" style={{ padding: 0, marginTop: '20px' }}>
        <table>
          <thead>
            <tr>
              <th>Waktu Siap Kirim</th>
              <th>ID Pesanan</th>
              <th>Produk</th>
              <th>Qty</th>
              <th>Total Dibayar</th>
              <th>Status Logistik</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map((o) => (
              <tr key={o.id}>
                <td>{formatDate(o.created_at)}</td>
                <td>{o.external_order_id}</td>
                <td>
                  {o.order_items?.map((item: any, i: number) => (
                    <div key={i}>{item.skus?.products?.name} ({item.skus?.sku_code})</div>
                  ))}
                </td>
                <td>{o.order_items?.[0]?.quantity} pcs</td>
                <td>Rp {Number(o.total_amount).toLocaleString('id-ID')}</td>
                <td>
                  <span style={{ background: '#fff3e0', color: '#e65100', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888' }}>Belum ada pesanan masuk.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
