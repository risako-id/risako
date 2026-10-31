import FormKoreksiKemasan from "./FormKoreksiKemasan";

type Row = {
  id: string; name: string; unit: string; stock_qty: number; min_stock: number; avg_cost: number;
};

export default function TabelKemasan({ rows, actionKoreksi }: { rows: Row[], actionKoreksi: (fd: FormData) => void }) {
  return (
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
      <table>
        <thead>
          <tr>
            <th>Nama Kemasan</th>
            <th>Stok Tersedia</th>
            <th>Harga Rata-rata</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td><strong>{r.name}</strong></td>
              <td className={r.stock_qty <= r.min_stock ? "text-red" : ""}>
                {r.stock_qty} {r.unit}
              </td>
              <td>Rp {r.avg_cost.toLocaleString('id-ID')} / {r.unit}</td>
              <td>
                <FormKoreksiKemasan action={actionKoreksi} item={r} />
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>Belum ada kemasan.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
