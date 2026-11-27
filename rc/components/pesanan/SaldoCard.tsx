export default function SaldoCard({ saldoVirtual, totalWithdrawn }: { saldoVirtual: number, totalWithdrawn: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
      <div className="card" style={{ borderLeft: '4px solid #2e7d32', margin: 0 }}>
        <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Saldo Virtual (Belum Withdraw)</p>
        <h2 style={{ margin: '5px 0 0 0', color: '#2e7d32' }}>Rp {saldoVirtual.toLocaleString('id-ID')}</h2>
      </div>
      <div className="card" style={{ borderLeft: '4px solid #1565c0', margin: 0 }}>
        <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Total Sudah Withdraw</p>
        <h2 style={{ margin: '5px 0 0 0', color: '#1565c0' }}>Rp {totalWithdrawn.toLocaleString('id-ID')}</h2>
      </div>
    </div>
  );
}
