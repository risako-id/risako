"use client";
import { useState } from "react";

export default function FormPembelian({ action, rawMaterials, packagings }: { 
  action: (fd: FormData) => void, 
  rawMaterials: any[], 
  packagings: any[] 
}) {
  const [type, setType] = useState("raw_material");

  const items = type === "raw_material" ? rawMaterials : packagings;

  return (
    <form action={action} className="card" style={{ borderLeft: '4px solid #1565c0' }}>
      <h2 style={{ marginTop: 0 }}>Catat Pembelian (Purchasing)</h2>
      <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '-10px' }}>
        Mencatat uang keluar & stok masuk secara otomatis.
      </p>
      
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
      </div>
      
      <div style={{ marginTop: '15px' }}>
        <button type="submit" style={{ background: '#1565c0' }}>Simpan Pembelian</button>
      </div>
    </form>
  );
}
