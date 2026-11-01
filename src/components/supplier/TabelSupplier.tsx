type Row = {
  id: string;
  name: string;
  contact: string | null;
};

export default function TabelSupplier({ rows }: { rows: Row[] }) {
  return (
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
      <table>
        <thead>
          <tr>
            <th>Nama Supplier</th>
            <th>Kontak</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td><strong>{r.name}</strong></td>
              <td>{r.contact || "-"}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={2} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>Belum ada data supplier.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
