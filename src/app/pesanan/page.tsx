import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PesananPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

  const statusFilter = (resolvedSearchParams.status as string) || "";
  const startDate = (resolvedSearchParams.startDate as string) || "";
  const endDate = (resolvedSearchParams.endDate as string) || "";
  const searchId = (resolvedSearchParams.searchId as string) || "";

  const allowedStatuses = [
    'AWAITING_COLLECTION', 
    'IN_TRANSIT', 
    'DELIVERED', 
    'COMPLETED', 
    'RETURNED', 
    'CANCELLED'
  ];

  // 1. Tambahkan platforms(name) di dalam select
  let query = supabaseServer
    .from("orders")
    .select(`
      id, external_order_id, status, created_at, total_amount,
      platforms (name),
      order_items (quantity, skus (sku_code, products(name)))
    `)
    .in('status', allowedStatuses);

  if (statusFilter) query = query.eq('status', statusFilter);
  if (startDate) query = query.gte('created_at', `${startDate}T00:00:00Z`);
  if (endDate) query = query.lte('created_at', `${endDate}T23:59:59Z`);
  if (searchId) query = query.ilike('external_order_id', `%${searchId}%`);

  const { data: orders } = await query.order("created_at", { ascending: false }).limit(50);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(d);
    
    const getPart = (type: string) => parts.find(p => p.type === type)?.value;
    return `${getPart('day')}-${getPart('month')}-${getPart('year')} ${getPart('hour')}:${getPart('minute')}`;
  };

  return (
    <div>
      <h1>Pesanan Online</h1>

      {/* UI FILTER */}
      <div className="card" style={{ padding: '15px', marginTop: '20px', marginBottom: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <form method="GET" action="/pesanan" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: '100%', alignItems: 'flex-end' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Cari ID Pesanan</label>
            <input type="text" name="searchId" placeholder="Contoh: 5873..." defaultValue={searchId} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Dari Tanggal</label>
            <input type="date" name="startDate" defaultValue={startDate} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Sampai Tanggal</label>
            <input type="date" name="endDate" defaultValue={endDate} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Status</label>
            <select name="status" defaultValue={statusFilter} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
              <option value="">Semua Status</option>
              <option value="AWAITING_COLLECTION">Awaiting Collection</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="COMPLETED">Completed</option>
              <option value="RETURNED">Returned</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <button type="submit" style={{ padding: '9px 15px', background: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Terapkan Filter
            </button>
            <a href="/pesanan" style={{ padding: '9px 15px', marginLeft: '5px', background: '#e0e0e0', color: '#333', textDecoration: 'none', borderRadius: '4px', fontSize: '14px' }}>
              Reset
            </a>
          </div>
        </form>
      </div>

      {/* TABEL PESANAN */}
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Waktu Siap Kirim</th>
              <th>ID Pesanan</th>
              <th>Platform</th> {/* <-- KOLOM BARU */}
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
                  {/* Tampilkan nama platform, ubah jadi huruf kapital di awal (Tiktok) */}
                  <span style={{ fontWeight: 'bold' }}>
                    {o.platforms ? (o.platforms as any).name : '-'}
                  </span>
                </td>
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
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                  Tidak ada pesanan yang sesuai dengan filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
