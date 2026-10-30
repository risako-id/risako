import { supabaseServer } from "@/lib/supabase-server";
import { tambahBahanBaku } from "./actions";
import FormBahanBaku from "@/components/bahan-baku/FormBahanBaku";
import TabelBahanBaku from "@/components/bahan-baku/TabelBahanBaku";

export const dynamic = "force-dynamic";

export default async function BahanBakuPage() {
  const { data, error } = await supabaseServer
    .from("raw_materials")
    .select("id, name, unit, stock_qty, min_stock, avg_cost")
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="card text-red">Error: {error.message}</div>;
  }

  return (
    <div>
      <h1>Bahan Baku Dapur</h1>
      <FormBahanBaku action={tambahBahanBaku} />
      <h2>Daftar Bahan Baku</h2>
      <TabelBahanBaku rows={data || []} />
    </div>
  );
}
