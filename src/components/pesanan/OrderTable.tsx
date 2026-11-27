export default function OrderTable({ orders }: { orders: any[] }) {
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(d);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value;
    return `${getPart('day')}-${getPart('month')}-${getPart('year')} ${getPart('hour')}:${getPart('minute')}`;
  };

  return (
    <div className="card" style={{ padding: 0 }}>
      <table>
        <thead>
          <tr>
            <th>Waktu</th>
            <th>ID Pesanan</th>
            <th>Toko</th>
            <th>Produk</th>
            <th>Qty</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders?.map((o: any) => {
            const isLoss = ['RETURNED', 'CANCELLED'].includes(o.status);
            return (
              <tr key={o.id}>
                <td>{formatDate(o.created_at)}</td>
                <td>{o.external_order_id}</td>
                <td><strong>{(o.stores as any)?.name || "-"}</strong></td>
                <td>
                  {o.order_items?.map((item: any, i: number) => (
                    <div key={i}>{item.skus?.products?.name} ({item.skus?.sku_code})</div>
                  ))}
                </td>
                <td>{o.order_items?.[0]?.quantity} pcs</td>
                <td>Rp {Number(o.total_amount).toLocaleString('id-ID')}</td>
                <td>
                  <span style={{ 
                    background: isLoss ? '#ffebee' : '#fff3e0', 
                    color: isLoss ? '#c62828' : '#e65100', 
                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold'
                  }}>
                    {o.status}
                  </span>
                </td>
              </tr>
            );
          })}
          {(!orders || orders.length === 0) && (
            <tr><td colSpan={7} style={{ textAlign: 'center', color: '#888', padding: '20px' }}>Tidak ada data pesanan.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
