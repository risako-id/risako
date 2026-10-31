"use client";

export default function FormKaryawan({ action }: { action: (fd: FormData) => void }) {
  return (
    <form action={action} className="card">
      <h2 style={{ marginTop: 0 }}>Tambah Karyawan & Akun Login</h2>
      <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '-10px' }}>Password default: 123456</p>
      <div className="grid-form">
        <input name="name" placeholder="Nama Lengkap Karyawan" required />
        <input name="username" placeholder="Username (tanpa spasi, ex: budi)" required />
        <select name="role" required>
          <option value="">-- Pilih Divisi --</option>
          <option value="produksi">Produksi (Dapur)</option>
          <option value="penjualan">Penjualan (Packing/CS)</option>
          <option value="owner">Owner</option>
        </select>
        <input name="commission_rate" type="number" placeholder="Tarif Komisi (Rp)" required />
      </div>
      <div style={{ marginTop: '15px' }}>
        <button type="submit">Buat Akun Karyawan</button>
      </div>
    </form>
  );
}
