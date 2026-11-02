"use client";

export default function FormBayarOwnerLoan({ 
  action, 
  cashAccounts 
}: { 
  action: (fd: FormData) => void, 
  cashAccounts: any[] 
}) {
  const assetAccounts = cashAccounts.filter(a => a.type !== 'liability');
  const liabilityAccounts = cashAccounts.filter(a => a.type === 'liability');

  return (
    <form action={action} className="card" style={{ borderTop: '4px solid #2e7d32', marginTop: '20px' }}>
      <h3 style={{ marginTop: 0 }}>Bayar Utang Owner / Kredit</h3>
      <p style={{ fontSize: '0.8rem', color: '#666' }}>Gunakan Kas Toko untuk melunasi utang ke Owner Loan atau Kredit.</p>
      
      <div className="grid-form">
        <input name="amount" type="number" placeholder="Nominal (Rp)" required />
        
        <select name="source_account_id" required>
          <option value="">-- Sumber Dana (Kas/Bank) --</option>
          {assetAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        <select name="target_account_id" required>
          <option value="">-- Pilih Akun Utang --</option>
          {liabilityAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        <input name="note" placeholder="Catatan (Opsional)" />
      </div>
      
      <div style={{ marginTop: '15px' }}>
        <button type="submit" style={{ background: '#2e7d32' }}>Proses Pembayaran Utang</button>
      </div>
    </form>
  );
}
