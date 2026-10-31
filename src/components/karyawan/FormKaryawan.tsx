"use client";

export default function FormKaryawan({ action }: { action: (fd: FormData) => void }) {
  return (
    <form action={action} className="card">
      <h2 style={{ marginTop: 0 }}>Tambah Karyawan</h2>
      <div className="grid-form">
        <input name="name" placeholder="Nama Karyawan" required />
        <select name="role" required>
          <option value="">-- Pilih Divisi --</option>
          <option value="produksi">Produksi (Dapur)</option>
          <option value="penjualan">Penjualan (Packing/CS)</option>
          <option value="owner">Owner</option>
        </select>
        <input name="commission_rate" type="number" placeholder="Tarif Komisi (Rp per pcs/resi)" required />
      </div>
      <div style={{ marginTop: '15px' }}>
        <button type="submit">Simpan Karyawan</button>
      </div>
    </form>
  );
}
