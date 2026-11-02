"use client";

export default function FormDompet({ action }: { action: (fd: FormData) => void }) {
  return (
    <form action={action} className="card" style={{ borderLeft: '4px solid #1565c0' }}>
      <h2 style={{ marginTop: 0 }}>Tambah Dompet / Akun Utang</h2>
      <div className="grid-form">
        <input name="name" placeholder="Nama (ex: Bank BCA / Kredit BCA / Owner Loan)" required />
        <select name="type" required>
          <option value="asset">Aset (Kas / Rekening / E-Wallet)</option>
          <option value="liability">Kredit / Liabilitas (Utang)</option>
        </select>
        <input name="initial_balance" type="number" placeholder="Saldo / Utang Awal (Rp)" defaultValue="0" />
      </div>
      <div style={{ marginTop: '15px' }}>
        <button type="submit">Simpan</button>
      </div>
    </form>
  );
}
