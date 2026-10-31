"use client";

export default function FormKeuangan({ 
  actionLoan, 
  actionOpex,
  cashAccounts 
}: { 
  actionLoan: (fd: FormData) => void,
  actionOpex: (fd: FormData) => void,
  cashAccounts: any[]
}) {
  return (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      
      {/* FORM OWNER LOAN (Suntik Dana Murni) */}
      <form action={actionLoan} className="card" style={{ flex: 1, minWidth: '300px', borderTop: '4px solid #1565c0' }}>
        <h3 style={{ marginTop: 0 }}>Suntik Dana (Owner Loan)</h3>
        <p style={{ fontSize: '0.8rem', color: '#666' }}>Hanya untuk memindahkan uang Anda ke Kas Toko.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input name="amount" type="number" placeholder="Nominal (Rp)" required />
          <select name="cash_account_id" required>
            <option value="">-- Masuk ke Dompet Mana? --</option>
            {cashAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <input name="note" placeholder="Keterangan (ex: Modal Awal)" />
          <button type="submit" style={{ background: '#1565c0' }}>Catat Pinjaman Masuk</button>
        </div>
      </form>

      {/* FORM PENGELUARAN */}
      <form action={actionOpex} className="card" style={{ flex: 1, minWidth: '300px', borderTop: '4px solid #c62828' }}>
        <h3 style={{ marginTop: 0 }}>Catat Pengeluaran</h3>
        <p style={{ fontSize: '0.8rem', color: '#666' }}>Untuk Opex atau Belanja (selain menu Pembelian).</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input name="amount" type="number" placeholder="Nominal (Rp)" required />
          
          <select name="cash_account_id" required>
            <option value="">-- Pilih Dompet --</option>
            {cashAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>

          <select name="source_fund" required>
            <option value="">-- Sumber Uang --</option>
            <option value="cash">Kas Toko (Uang Toko Sendiri)</option>
            <option value="owner_loan">Owner Loan (Uang Pribadi Saya)</option>
          </select>

          <select name="category">
            <option value="opex">Biaya Operasional (Listrik, Gaji, dll)</option>
            <option value="raw_material">Belanja Bahan Baku</option>
            <option value="other">Lain-lain</option>
          </select>
          <input name="note" placeholder="Keterangan (ex: Bayar Listrik)" />
          <button type="submit" style={{ background: '#c62828' }}>Catat Uang Keluar</button>
        </div>
      </form>

    </div>
  );
}
