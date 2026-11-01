"use client";

export default function FormKasir({ action, skus, cashAccounts }: { action: (fd: FormData) => void, skus: any[], cashAccounts: any[] }) {
  return (
    <form action={action} className="card" style={{ borderLeft: '4px solid #1565c0', background: '#f8fbff' }}>
      <h2 style={{ marginTop: 0, color: '#1565c0' }}>🛒 Kasir Offline (POS)</h2>
      <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '-10px' }}>
        Proses pembayaran langsung. (Tidak memotong stok Box).
      </p>
      
      <div className="grid-form">
        <select name="sku_id" required style={{ padding: '12px', fontSize: '1rem' }}>
          <option value="">-- Pilih Produk --</option>
          {skus.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.sku_code}) - Rp {s.sell_price.toLocaleString('id-ID')}
            </option>
          ))}
        </select>
        
        <input name="qty" type="number" placeholder="Jumlah Beli" required min="1" defaultValue="1" style={{ padding: '12px', fontSize: '1rem' }} />

        <select name="cash_account_id" required style={{ padding: '12px', fontSize: '1rem', border: '2px solid #1565c0' }}>
          <option value="">-- Uang Masuk ke Dompet Mana? --</option>
          {cashAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>
      
      <div style={{ marginTop: '15px' }}>
        <button type="submit" style={{ background: '#1565c0', width: '100%', padding: '15px', fontSize: '1rem', fontWeight: 'bold' }}>
          Proses Pembayaran
        </button>
      </div>
    </form>
  );
}
