"use client";

type Option = { id: string; name: string; sku_code?: string };

export default function FormResep({ 
  skus, 
  rawMaterials, 
  packagings,
  addBahanAction,
  addKemasanAction
}: { 
  skus: Option[], 
  rawMaterials: Option[], 
  packagings: Option[],
  addBahanAction: (fd: FormData) => void,
  addKemasanAction: (fd: FormData) => void
}) {
  return (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      {/* FORM BAHAN BAKU */}
      <form action={addBahanAction} className="card" style={{ flex: 1, minWidth: '300px' }}>
        <h3 style={{ marginTop: 0 }}>Racik Bahan Baku (Dapur)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <select name="sku_id" required>
            <option value="">-- Pilih Produk --</option>
            {skus.map(s => <option key={s.id} value={s.id}>{s.name} ({s.sku_code})</option>)}
          </select>
          <select name="raw_material_id" required>
            <option value="">-- Pilih Bahan --</option>
            {rawMaterials.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <input name="quantity_needed" type="number" step="0.01" placeholder="Jumlah Butuh (ex: 1)" required />
          <button type="submit">Tambah ke Resep Dapur</button>
        </div>
      </form>

      {/* FORM KEMASAN */}
      <form action={addKemasanAction} className="card" style={{ flex: 1, minWidth: '300px' }}>
        <h3 style={{ marginTop: 0 }}>Racik Kemasan (Packing)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <select name="sku_id" required>
            <option value="">-- Pilih Produk --</option>
            {skus.map(s => <option key={s.id} value={s.id}>{s.name} ({s.sku_code})</option>)}
          </select>
          <select name="packaging_material_id" required>
            <option value="">-- Pilih Kemasan --</option>
            {packagings.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input name="quantity_needed" type="number" step="0.01" placeholder="Jumlah Butuh (ex: 1)" required />
          <button type="submit" style={{ background: '#0056b3' }}>Tambah ke Resep Packing</button>
        </div>
      </form>
    </div>
  );
}
