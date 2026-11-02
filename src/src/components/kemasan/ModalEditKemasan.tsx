"use client";
import { useState } from "react";
import { editKemasan, hapusKemasan } from "@/app/kemasan/actions";
import { useRouter } from "next/navigation";

export default function ModalEditKemasan({ item }: { item: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Yakin ingin menghapus kemasan ini?")) return;
    setIsDeleting(true);
    const res = await hapusKemasan(item.id);
    setIsDeleting(false);
    if (res.error) alert(res.error);
    else { setIsOpen(false); router.refresh(); }
  };

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} style={{ padding: '5px 10px', fontSize: '0.8rem', background: '#555' }}>Edit</button>
      {isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', margin: '20px' }}>
            <h3 style={{ marginTop: 0 }}>Edit Kemasan</h3>
            <form action={editKemasan} onSubmit={() => setIsOpen(false)}>
              <input type="hidden" name="id" value={item.id} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input name="name" defaultValue={item.name} placeholder="Nama Kemasan" required />
                <input name="unit" defaultValue={item.unit} placeholder="Satuan" required />
                <input name="min_stock" type="number" defaultValue={item.min_stock} placeholder="Batas Minimum" />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={handleDelete} disabled={isDeleting} style={{ background: '#c62828', flex: 1 }}>{isDeleting ? "..." : "Hapus"}</button>
                <button type="button" onClick={() => setIsOpen(false)} style={{ background: '#ccc', color: '#333', flex: 1 }}>Batal</button>
                <button type="submit" style={{ flex: 1 }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
