"use client";

export default function FormSimulasi({ action, skus }: { action: (fd: FormData) => void, skus: any[] }) {
  return (
    <form action={action} className="card" style={{ borderLeft: '4px solid #ff9800' }}>
      <h2 style={{ marginTop: 0 }}>Simulasi Pesanan Masuk</h2>
      <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '-10px' }}>
        Form ini mensimulasikan kiriman Webhook dari TikTok. Stok produk & kemasan akan otomatis terpotong.
      </p>
      <div className="grid-form">
        <select name="sku_id" required>
          <option value="">-- Pilih Produk Terjual --</option>
          {skus.map(s => <option key={s.id} value={s.id}>{s.name} ({s.sku_code})</option>)}
        </select>
        <input name="qty" type="number" placeholder="Jumlah Beli (pcs)" required min="1" defaultValue="1" />
      </div>
      <div style={{ marginTop: '15px' }}>
        <button type="submit" style={{ background: '#f57c00' }}>Buat Pesanan Simulasi</button>
      </div>
    </form>
  );
}
