"use client";
import { useState } from "react";

export default function FormPembelian({ action, rawMaterials, packagings, cashAccounts, suppliers }: { 
  action: (fd: FormData) => void, 
  rawMaterials: any[], 
  packagings: any[],
  cashAccounts: any[],
  suppliers: any[]
}) {
  const [type, setType] = useState("raw_material");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  
  const items = type === "raw_material" ? rawMaterials : packagings;

  return (
    <form action={action} className="card" style={{ borderLeft: '4px solid #1565c0' }}>
      <h2 style={{ marginTop: 0 }}>Catat Pembelian (Purchasing)</h2>
      
      <div className="grid-form">
        <select name="item_type" value={type} onChange={(e) => setType(e.target.value)} required>
          <option value="raw_material">Bahan Baku (Dapur)</option>
          <option value="packaging">Kemasan (Packing)</option>
        </select>

        <select name="item_id" required>
          <option value="">-- Pilih Barang --</option>
          {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>

        <select name="supplier_id" required>
          <option value="">-- Pilih Supplier --</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <input name="qty" type="number" step="0.01" placeholder="Jumlah Beli" required />
        <input name="total_price" type="number" placeholder="Total Harga (Rp)" required />
        <input name="note" placeholder="Keterangan (ex: Beli Puyuh)" />

        <select name="payment_status" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} required>
          <option value="paid">Lunas</option>
          <option value="unpaid">Kredit (Tempo)</option>
        </select>

        {paymentStatus === "paid" ? (
          <select name="cash_account_id" required>
            <option value="">-- Sumber Dana (Bayar Lunas) --</option>
            {cashAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        ) : (
          <div>
            <label style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: '4px' }}>Jatuh Tempo:</label>
            <input name="due_date" type="date" required style={{ width: '100%' }} />
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '15px' }}>
        <button type="submit" style={{ background: '#1565c0' }}>Simpan Pembelian</button>
      </div>
    </form>
  );
}
