export default function SettledTable({ settlements }: { settlements: any[] }) {
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
            <th>Waktu Settle</th>
            <th>ID Pesanan</th>
            <th>Toko</th>
            <th>Nominal Cair (Net)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {settlements?.map((s: any) => (
            <tr key={s.id}>
              <td>{formatDate(s.settled_at)}</td>
              <td>{s.orders?.external_order_id}</td>
              <td>{(s.orders?.stores as any)?.name || "-"}</td>
              <td style={{ color: '#2e7d32', fontWeight: 'bold' }}>Rp {Number(s.net_amount).toLocaleString('id-ID')}</td>
              <td><span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>SETTLED</span></td>
            </tr>
          ))}
          {settlements.length === 0 && (
            <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888', padding: '20px' }}>Belum ada data pesanan terbayar (settle).</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
