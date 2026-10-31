import { supabaseServer } from "@/lib/supabase-server";
import { prosesKasir } from "./actions";
import FormKasir from "@/components/kasir/FormKasir";

export const dynamic = "force-dynamic";

export default async function KasirPage() {
  // Ambil SKU dengan harga jualnya
  const { data: skusData } = await supabaseServer.from("skus").select("id, sku_code, sell_price, products(name)");
  const skus = (skusData || []).map(s => ({ 
    id: s.id, 
    name: (s.products as any)?.name, 
    sku_code: s.sku_code,
    sell_price: s.sell_price
  }));

  // Ambil riwayat transaksi offline
  const { data: orders } = await supabaseServer
    .from("orders")
    .select(`
      id, external_order_id, total_amount, created_at,
      order_items (quantity, skus (sku_code, products(name)))
    `)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div>
      <h1>Kasir Offline</h1>
      <FormKasir action={prosesKasir} skus={skus} />

      <h2>Riwayat Transaksi Offline Terakhir</h2>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Waktu</th>
              <th>ID Transaksi</th>
              <th>Produk</th>
              <th>Qty</th>
              <th>Total (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map((o) => (
              <tr key={o.id}>
                <td>{new Date(o.created_at).toLocaleString('id-ID')}</td>
                <td>{o.external_order_id}</td>
                <td>
                  {o.order_items?.map((item: any, i: number) => (
                    <div key={i}>{item.skus?.products?.name}</div>
                  ))}
                </td>
                <td>{o.order_items?.[0]?.quantity} pcs</td>
                <td style={{ color: '#2e7d32', fontWeight: 'bold' }}>{o.total_amount.toLocaleString('id-ID')}</td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>Belum ada transaksi offline.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
