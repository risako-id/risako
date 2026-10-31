"use client";

export default function FormKemasan({ action }: { action: (fd: FormData) => void }) {
  return (
    <form action={action} className="card">
      <h2 style={{ marginTop: 0 }}>Daftarkan Kemasan Baru</h2>
      <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '-10px' }}>*Harga akan terisi otomatis saat Anda melakukan Pembelian.</p>
      <div className="grid-form">
        <input name="name" placeholder="Nama Kemasan (ex: Box Kecil)" required />
        <input name="unit" placeholder="Satuan (ex: pcs, roll)" required />
        <input name="min_stock" type="number" step="0.01" placeholder="Batas Stok Menipis" />
        <input name="stock_qty" type="number" step="0.01" placeholder="Stok Awal (Opsional)" />
      </div>
      <div style={{ marginTop: '15px' }}>
        <button type="submit">Simpan Kemasan</button>
      </div>
    </form>
  );
}
