"use client";
import { useState } from "react";

export default function FormBayarHutang({ action, debt, cashAccounts }: { 
  action: (fd: FormData) => void, 
  debt: any, 
  cashAccounts: any[] 
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} style={{ padding: '5px 10px', fontSize: '0.8rem', background: '#2e7d32' }}>
        Bayar
      </button>

      {isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', margin: '20px' }}>
            <h3 style={{ marginTop: 0 }}>Bayar Hutang</h3>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>Sisa Hutang: <strong>Rp {Number(debt.remaining_amount).toLocaleString('id-ID')}</strong></p>
            
            <form action={action} onSubmit={() => setIsOpen(false)}>
              <input type="hidden" name="debt_id" value={debt.id} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input name="amount" type="number" max={debt.remaining_amount} defaultValue={debt.remaining_amount} placeholder="Nominal Bayar (Rp)" required />
                
                <select name="cash_account_id" required>
                  <option value="">-- Sumber Dana Pembayaran --</option>
                  {cashAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>

                <input name="note" placeholder="Catatan (Opsional)" />

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsOpen(false)} style={{ flex: 1, background: '#ccc', color: '#333' }}>Batal</button>
                  <button type="submit" style={{ flex: 1, background: '#2e7d32' }}>Konfirmasi</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
