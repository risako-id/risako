"use client";
import { useState } from "react";

export default function FormKoreksiBahan({ action, item }: { action: (fd: FormData) => void, item: any }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} style={{ padding: '5px 10px', fontSize: '0.8rem', background: '#f57c00' }}>
        Koreksi
      </button>

      {isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', margin: '20px' }}>
            <h3 style={{ marginTop: 0 }}>Koreksi Stok: {item.name}</h3>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>Stok Sistem: <strong>{item.stock_qty} {item.unit}</strong></p>
            
            <form action={action} onSubmit={() => setIsOpen(false)}>
              <input type="hidden" name="id" value={item.id} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input name="qty_fisik" type="number" step="0.01" placeholder={`Stok Fisik di Gudang (${item.unit})`} required />
                <input name="alasan" placeholder="Alasan (ex: Tumpah, Rusak)" required />
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsOpen(false)} style={{ flex: 1, background: '#ccc', color: '#333' }}>Batal</button>
                  <button type="submit" style={{ flex: 1, background: '#f57c00' }}>Simpan</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
