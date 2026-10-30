import { supabaseServer } from "@/lib/supabase-server";
import { tambahProduk } from "./actions";
import FormProduk from "@/components/produk/FormProduk";
import TabelProduk from "@/components/produk/TabelProduk";

export const dynamic = "force-dynamic";

export default async function ProdukPage() {
  const { data, error } = await supabaseServer
    .from("skus")
    .select("id, sku_code, variant_name, stock_qty, min_stock, sell_price, products(name)")
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="card text-red">Error mengambil data: {error.message}</div>;
  }

  return (
    <div>
      <h1>Produk & Stok Jadi</h1>
      <FormProduk action={tambahProduk} />
      <h2>Daftar Stok</h2>
      <TabelProduk rows={data as any || []} />
    </div>
  );
}
