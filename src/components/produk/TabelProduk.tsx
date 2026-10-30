type Row = {
  id: string;
  sku_code: string;
  variant_name: string | null;
  stock_qty: number;
  min_stock: number;
  sell_price: number;
  products: { name: string } | null;
};

export default function TabelProduk({ rows }: { rows: Row[] }) {
  return (
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
      <table>
        <thead>
          <tr>
            <th>Nama Produk</th>
            <th>Kode SKU</th>
            <th>Stok Jadi</th>
            <th>Harga Jual</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <strong>{r.products?.name}</strong>
                {r.variant_name && <span style={{ color: '#666', fontSize: '0.9em' }}> ({r.variant_name})</span>}
              </td>
              <td>{r.sku_code}</td>
              <td className={r.stock_qty <= r.min_stock ? "text-red" : ""}>
                {r.stock_qty} pcs
              </td>
              <td>Rp {r.sell_price.toLocaleString('id-ID')}</td>
              <td>
                <button style={{ padding: '5px 10px', fontSize: '0.8rem', background: '#555' }}>Edit</button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                Belum ada produk. Silakan tambah produk baru.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
