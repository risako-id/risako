"use client";

export default function FormProduksi({ action, skus, karyawan }: { action: (fd: FormData) => void, skus: any[], karyawan: any[] }) {
  return (
    <form action={action} className="card" style={{ borderLeft: '4px solid #1a1a1a' }}>
      <h2 style={{ marginTop: 0 }}>Lapor Hasil Produksi</h2>
      <div className="grid-form">
        <select name="employee_id" required>
          <option value="">-- Siapa yang Masak? --</option>
          {karyawan.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
        </select>
        <select name="sku_id" required>
          <option value="">-- Pilih Produk Jadi --</option>
          {skus.map(s => <option key={s.id} value={s.id}>{s.name} ({s.sku_code})</option>)}
        </select>
        <input name="qty_produced" type="number" placeholder="Jumlah Selesai Masak (pcs)" required />
        <input name="note" placeholder="Catatan (opsional)" />
      </div>
      <div style={{ marginTop: '15px' }}>
        <button type="submit" style={{ background: '#2e7d32' }}>Selesai Produksi & Potong Bahan</button>
      </div>
    </form>
  );
}
