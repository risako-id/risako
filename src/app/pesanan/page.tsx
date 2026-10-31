import { supabaseServer } from "@/lib/supabase-server";
import { simulasiPesanan } from "./actions";
import FormSimulasi from "@/components/pesanan/FormSimulasi";

export const dynamic = "force-dynamic";

export default async function PesananPage() {
  const { data: skusData } = await supabaseServer.from("skus").select("id, sku_code, products(name)");
  const skus = (skusData || []).map(s => ({ id: s.id, name: (s.products as any)?.name, sku_code: s.sku_code }));

  const { data: orders } = await supabaseServer
    .from("orders")
    .select(`
      id, external_order_id, status, created_at,
      order_items (quantity, skus (sku_code, products(name)))
    `)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div>
      <h1>Pesanan Online</h1>
      <FormSimulasi action={simulasiPesanan} skus={skus} />

      <h2>Daftar Pesanan Terakhir</h2>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Waktu</th>
              <th>ID Pesanan</th>
              <th>Produk</th>
              <th>Qty</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map((o) => (
              <tr key={o.id}>
                <td>{new Date(o.created_at).toLocaleString('id-ID')}</td>
                <td>{o.external_order_id}</td>
                <td>
                  {o.order_items?.map((item: any, i: number) => (
                    <div key={i}>{item.skus?.products?.name} ({item.skus?.sku_code})</div>
                  ))}
                </td>
                <td>{o.order_items?.[0]?.quantity} pcs</td>
                <td><span style={{ background: '#fff3e0', color: '#e65100', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{o.status}</span></td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>Belum ada pesanan masuk.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
