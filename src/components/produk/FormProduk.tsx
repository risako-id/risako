"use client";

export default function FormProduk({ action }: { action: (fd: FormData) => void }) {
  return (
    <form action={action} className="card">
      <h2 style={{ marginTop: 0 }}>Tambah Produk Baru</h2>
      <div className="grid-form">
        <input name="name" placeholder="Nama Produk (ex: Puyuh Ungkep)" required />
        <input name="sku_code" placeholder="Kode SKU Internal (ex: PYH-01)" required />
        <input name="variant_name" placeholder="Variasi (opsional)" />
        <input name="cost_price" type="number" placeholder="HPP (Modal + Box)" required />
        <input name="sell_price" type="number" placeholder="Harga Jual Standar" required />
        <input name="stock_qty" type="number" placeholder="Stok Awal (Barang Jadi)" required />
        <input name="min_stock" type="number" placeholder="Batas Stok Menipis" />
      </div>
      <div style={{ marginTop: '15px' }}>
        <button type="submit">Simpan Produk</button>
      </div>
    </form>
  );
}
