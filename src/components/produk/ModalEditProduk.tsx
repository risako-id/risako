"use client";
import { useState } from "react";
import { editProduk, hapusProduk } from "@/app/produk/actions";
import { useRouter } from "next/navigation";

export default function ModalEditProduk({ item }: { item: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Yakin ingin menghapus produk ini?")) return;
    setIsDeleting(true);
    const res = await hapusProduk(item.id);
    setIsDeleting(false);
    if (res.error) alert(res.error);
    else {
      setIsOpen(false);
      router.refresh();
    }
  };

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} style={{ padding: '5px 10px', fontSize: '0.8rem', background: '#555' }}>
        Edit
      </button>

      {isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '20px' }}>
            <h3 style={{ marginTop: 0 }}>Edit Produk</h3>
            
            <form action={editProduk} onSubmit={() => setIsOpen(false)}>
              <input type="hidden" name="id" value={item.id} />
              <div className="grid-form">
                <input name="name" defaultValue={item.products?.name} placeholder="Nama Produk" required />
                <input name="sku_code" defaultValue={item.sku_code} placeholder="Kode SKU" required />
                <input name="variant_name" defaultValue={item.variant_name || ""} placeholder="Variasi" />
                <input name="cost_price" type="number" defaultValue={item.cost_price} placeholder="HPP" required />
                <input name="sell_price" type="number" defaultValue={item.sell_price} placeholder="Harga Jual" required />
                <input name="min_stock" type="number" defaultValue={item.min_stock} placeholder="Batas Stok" />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={handleDelete} disabled={isDeleting} style={{ background: '#c62828', flex: 1 }}>
                  {isDeleting ? "Menghapus..." : "Hapus Produk"}
                </button>
                <button type="button" onClick={() => setIsOpen(false)} style={{ background: '#ccc', color: '#333', flex: 1 }}>
                  Batal
                </button>
                <button type="submit" style={{ flex: 1 }}>
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
