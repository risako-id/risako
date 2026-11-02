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

        {/* PEMILIHAN METODE PEMBAYARAN / DOMPET */}
        <select name="payment_method" required>
          <option value="">-- Pilih Sumber Dana --</option>
          
          <optgroup label="💵 BAYAR LUNAS (Uang Kas/Bank Berkurang)">
            {cashAccounts.filter(a => a.type !== 'liability').map(a => (
              <option key={a.id} value={a.id}>Lunas via {a.name}</option>
            ))}
          </optgroup>
          
          <optgroup label="💳 BAYAR PAKAI UTANG / KREDIT (Kas Aman)">
            {cashAccounts.filter(a => a.type === 'liability').map(a => (
              <option key={a.id} value={a.id}>Kredit via {a.name}</option>
            ))}
          </optgroup>
        </select>

        {/* TANGGAL JATUH TEMPO (Hanya untuk Tempo Supplier atau Kredit) */}
        <div>
          <label style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '2px' }}>
            Jatuh Tempo (Kosongkan jika Lunas)
          </label>
          <input name="due_date" type="date" style={{ width: '100%' }} />
        </div>
      </div>
      
      <div style={{ marginTop: '15px' }}>
        <button type="submit" style={{ background: '#1565c0' }}>Simpan Pembelian</button>
      </div>
    </form>
  );
}
