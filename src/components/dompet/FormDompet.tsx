"use client";

export default function FormDompet({ action }: { action: (fd: FormData) => void }) {
  return (
    <form action={action} className="card" style={{ borderLeft: '4px solid #1565c0' }}>
      <h2 style={{ marginTop: 0 }}>Tambah Dompet Baru</h2>
      <div className="grid-form">
        <input name="name" placeholder="Nama Dompet (ex: Bank BCA)" required />
        <select name="type" required>
          <option value="cash">Kas Tunai (Laci)</option>
          <option value="bank">Rekening Bank</option>
          <option value="ewallet">E-Wallet (DANA/OVO)</option>
        </select>
        <input name="initial_balance" type="number" placeholder="Saldo Awal (Rp)" defaultValue="0" />
      </div>
      <div style={{ marginTop: '15px' }}>
        <button type="submit">Simpan Dompet</button>
      </div>
    </form>
  );
}
