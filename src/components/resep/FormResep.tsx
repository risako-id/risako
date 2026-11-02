"use client";
import { useState } from "react";
import { simpanResepBahan, simpanResepKemasan } from "@/app/resep/actions";

type Option = { id: string; name: string; sku_code?: string };

export default function FormResep({ skus, rawMaterials, packagings }: { 
  skus: Option[], rawMaterials: Option[], packagings: Option[] 
}) {
  const [bahanRows, setBahanRows] = useState([{ id: Date.now() }]);
  const [packingRows, setPackingRows] = useState([{ id: Date.now() }]);

  const addBahanRow = () => setBahanRows([...bahanRows, { id: Date.now() }]);
  const removeBahanRow = (id: number) => setBahanRows(bahanRows.filter(r => r.id !== id));

  const addPackingRow = () => setPackingRows([...packingRows, { id: Date.now() }]);
  const removePackingRow = (id: number) => setPackingRows(packingRows.filter(r => r.id !== id));

  return (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      
      {/* FORM RESEP DAPUR */}
      <form action={simpanResepBahan} className="card" style={{ flex: 1, minWidth: '350px' }}>
        <h3 style={{ marginTop: 0 }}>Racik Bahan Baku (Dapur)</h3>
        <select name="sku_id" required style={{ width: '100%', marginBottom: '15px', padding: '10px' }}>
          <option value="">-- Pilih Produk Jadi --</option>
          {skus.map(s => <option key={s.id} value={s.id}>{s.name} ({s.sku_code})</option>)}
        </select>

        {bahanRows.map((row, index) => (
          <div key={row.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <select name="raw_material_id[]" required style={{ flex: 2, padding: '8px' }}>
              <option value="">-- Pilih Bahan --</option>
              {rawMaterials.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <input name="quantity_needed[]" type="number" step="0.01" placeholder="Qty" required style={{ flex: 1, padding: '8px' }} />
            {bahanRows.length > 1 && (
              <button type="button" onClick={() => removeBahanRow(row.id)} style={{ background: '#c62828', padding: '8px' }}>X</button>
            )}
          </div>
        ))}
        
        <button type="button" onClick={addBahanRow} style={{ background: '#555', marginBottom: '15px', width: '100%' }}>+ Tambah Baris Bahan</button>
        <button type="submit" style={{ width: '100%', background: '#1a1a1a' }}>Simpan Semua Resep Dapur</button>
      </form>

      {/* FORM RESEP KEMASAN */}
      <form action={simpanResepKemasan} className="card" style={{ flex: 1, minWidth: '350px' }}>
        <h3 style={{ marginTop: 0 }}>Racik Kemasan (Packing)</h3>
        <select name="sku_id" required style={{ width: '100%', marginBottom: '15px', padding: '10px' }}>
          <option value="">-- Pilih Produk Jadi --</option>
          {skus.map(s => <option key={s.id} value={s.id}>{s.name} ({s.sku_code})</option>)}
        </select>

        {packingRows.map((row) => (
          <div key={row.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <select name="packaging_material_id[]" required style={{ flex: 2, padding: '8px' }}>
              <option value="">-- Pilih Kemasan --</option>
              {packagings.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input name="quantity_needed[]" type="number" step="0.01" placeholder="Qty" required style={{ flex: 1, padding: '8px' }} />
            {packingRows.length > 1 && (
              <button type="button" onClick={() => removePackingRow(row.id)} style={{ background: '#c62828', padding: '8px' }}>X</button>
            )}
          </div>
        ))}

        <button type="button" onClick={addPackingRow} style={{ background: '#555', marginBottom: '15px', width: '100%' }}>+ Tambah Baris Kemasan</button>
        <button type="submit" style={{ width: '100%', background: '#1565c0' }}>Simpan Semua Resep Packing</button>
      </form>

    </div>
  );
}
