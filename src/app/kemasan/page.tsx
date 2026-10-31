import { supabaseServer } from "@/lib/supabase-server";
import { tambahKemasan, koreksiStokKemasan } from "./actions";
import FormKemasan from "@/components/kemasan/FormKemasan";
import TabelKemasan from "@/components/kemasan/TabelKemasan";

export const dynamic = "force-dynamic";

export default async function KemasanPage() {
  const { data, error } = await supabaseServer
    .from("packaging_materials")
    .select("id, name, unit, stock_qty, min_stock, avg_cost")
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="card text-red">Error: {error.message}</div>;
  }

  return (
    <div>
      <h1>Gudang Kemasan</h1>
      <FormKemasan action={tambahKemasan} />
      <h2>Daftar Kemasan</h2>
      <TabelKemasan rows={data || []} actionKoreksi={koreksiStokKemasan} />
    </div>
  );
}
