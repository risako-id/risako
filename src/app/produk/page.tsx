import { supabase } from "@/lib/supabase";
import { tambahProduk, ubahStok } from "./actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string; sku_code: string; variant_name: string | null;
  stock_qty: number; min_stock: number; sell_price: number;
  products: { name: string } | null;
};

export default async function ProdukPage() {
  const { data, error } = await supabase
    .from("skus")
    .select("id, sku_code, variant_name, stock_qty, min_stock, sell_price, products(name)")
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <h1>Risako · Produk &amp; Stok</h1>
      {error && <p className="low">Error: {error.message}</p>}

      <h2>Tambah produk</h2>
      <form action={tambahProduk} className="card">
        <input name="name" placeholder="Nama produk" required />
        <input name="sku_code" placeholder="Kode SKU" required />
        <input name="variant_name" placeholder="Variasi (opsional)" />
        <input name="cost_price" type="number" placeholder="Harga modal" />
        <input name="sell_price" type="number" placeholder="Harga jual" />
        <input name="qty" type="number" placeholder="Stok awal" />
        <input name="min_stock" type="number" placeholder="Batas stok menipis" />
        <button>Simpan</button>
      </form>

      <h2>Daftar stok</h2>
      <table>
        <thead><tr><th>Produk</th><th>SKU</th><th>Stok</th><th>Ubah stok</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.products?.name}{r.variant_name ? ` (${r.variant_name})` : ""}</td>
              <td>{r.sku_code}</td>
              <td className={r.stock_qty <= r.min_stock ? "low" : ""}>{r.stock_qty}</td>
              <td>
                <form action={ubahStok} className="row">
                  <input type="hidden" name="sku_id" value={r.id} />
                  <select name="jenis"><option value="in">Masuk</option><option value="adjustment">Koreksi ±</option></select>
                  <input name="qty" type="number" placeholder="Jml" required />
                  <button>OK</button>
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
