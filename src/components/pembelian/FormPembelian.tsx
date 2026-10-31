"use client";
import { useState } from "react";

export default function FormPembelian({ action, rawMaterials, packagings, cashAccounts }: { 
  action: (fd: FormData) => void, 
  rawMaterials: any[], 
  packagings: any[],
  cashAccounts: any[]
}) {
  const [type, setType] = useState("raw_material");
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

        <input name="qty" type="number" step="0.01" placeholder="Jumlah Beli" required />
        <input name="total_price" type="number" placeholder="Total Harga (Rp)" required />
        <input name="note" placeholder="Keterangan (ex: Beli Puyuh Pasar)" />
        
        <select name="cash_account_id" required>
          <option value="">-- Pilih Dompet --</option>
          {cashAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        <select name="source_fund" required>
          <option value="">-- Sumber Uang --</option>
          <option value="cash">Kas Toko (Uang Toko Sendiri)</option>
          <option value="owner_loan">Owner Loan (Uang Pribadi Saya)</option>
        </select>
      </div>
      
      <div style={{ marginTop: '15px' }}>
        <button type="submit" style={{ background: '#1565c0' }}>Simpan Pembelian</button>
      </div>
    </form>
  );
}
