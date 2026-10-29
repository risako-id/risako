import { supabaseServer } from "@/lib/supabase-server";
import { tambahProduk, ubahStok } from "./actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string; sku_code: string; variant_name: string | null;
  stock_qty: number; min_stock: number; sell_price: number;
  products: { name: string } | null;
};

export default async function ProdukPage() {
  const { data, error } = await supabaseServer
    .from("skus")
    .select("id, sku_code, variant_name, stock_qty, min_stock, sell_price, products(name)")
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <h1>Risako · Produk &amp; Stok</h1>
      {error && <p style={{color: 'red'}}>Error: {error.message}</p>}

      <h2>Tambah produk</h2>
      <form action={tambahProduk} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
        <input name="name" placeholder="Nama produk" required />
        <input name="sku_code" placeholder="Kode SKU" required />
        <input name="variant_name" placeholder="Variasi (opsional)" />
        <input name="cost_price" type="number" placeholder="Harga modal" />
        <input name="sell_price" type="number" placeholder="Harga jual" />
        <input name="qty" type="number" placeholder="Stok awal" />
        <input name="min_stock" type="number" placeholder="Batas stok menipis" />
        <button type="submit">Simpan</button>
      </form>

      <h2>Daftar stok</h2>
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead><tr><th>Produk</th><th>SKU</th><th>Stok</th><th>Ubah stok</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.products?.name}{r.variant_name ? ` (${r.variant_name})` : ""}</td>
              <td>{r.sku_code}</td>
              <td style={{ color: r.stock_qty <= r.min_stock ? 'red' : 'black' }}>{r.stock_qty}</td>
              <td>
                <form action={ubahStok} style={{ display: 'flex', gap: '5px' }}>
                  <input type="hidden" name="sku_id" value={r.id} />
                  <select name="jenis"><option value="in">Masuk</option><option value="adjustment">Koreksi ±</option></select>
                  <input name="qty" type="number" placeholder="Jml" required />
                  <button type="submit">OK</button>
                </form>
              </td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={4}>Belum ada produk.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
