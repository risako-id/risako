type Row = {
  id: string;
  name: string;
  role: string;
  commission_rate: number;
};

export default function TabelKaryawan({ rows }: { rows: Row[] }) {
  return (
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
      <table>
        <thead>
          <tr>
            <th>Nama</th>
            <th>Divisi</th>
            <th>Tarif Komisi</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td><strong>{r.name}</strong></td>
              <td style={{ textTransform: 'capitalize' }}>{r.role}</td>
              <td>Rp {r.commission_rate.toLocaleString('id-ID')} / {r.role === 'produksi' ? 'pcs' : 'resi'}</td>
              <td>
                <button style={{ padding: '5px 10px', fontSize: '0.8rem', background: '#555' }}>Edit</button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                Belum ada data karyawan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
