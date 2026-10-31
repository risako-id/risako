"use client";

export default function FormKeuangan({ 
  actionLoan, 
  actionOpex 
}: { 
  actionLoan: (fd: FormData) => void,
  actionOpex: (fd: FormData) => void
}) {
  return (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      
      {/* FORM OWNER LOAN */}
      <form action={actionLoan} className="card" style={{ flex: 1, minWidth: '300px', borderTop: '4px solid #1565c0' }}>
        <h3 style={{ marginTop: 0 }}>Suntik Dana (Owner Loan)</h3>
        <p style={{ fontSize: '0.8rem', color: '#666' }}>Uang pribadi yang dipinjamkan ke toko. Toko wajib mengembalikan ini.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input name="amount" type="number" placeholder="Nominal (Rp)" required />
          <input name="note" placeholder="Keterangan (ex: Beli Bahan Baku)" />
          <button type="submit" style={{ background: '#1565c0' }}>Catat Pinjaman Masuk</button>
        </div>
      </form>

      {/* FORM PENGELUARAN */}
      <form action={actionOpex} className="card" style={{ flex: 1, minWidth: '300px', borderTop: '4px solid #c62828' }}>
        <h3 style={{ marginTop: 0 }}>Catat Pengeluaran</h3>
        <p style={{ fontSize: '0.8rem', color: '#666' }}>Catat biaya operasional (listrik, gaji, bensin) atau belanja bahan baku.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input name="amount" type="number" placeholder="Nominal (Rp)" required />
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
