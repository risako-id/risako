import { supabaseServer } from "@/lib/supabase-server";
import { tambahSupplier } from "./actions";
import FormSupplier from "@/components/supplier/FormSupplier";
import TabelSupplier from "@/components/supplier/TabelSupplier";

export const dynamic = "force-dynamic";

export default async function SupplierPage() {
  const { data, error } = await supabaseServer
    .from("suppliers")
    .select("id, name, contact")
    .order("created_at", { ascending: false });

  if (error) return <div className="card text-red">Error: {error.message}</div>;

  return (
    <div>
      <h1>Master Supplier</h1>
      <FormSupplier action={tambahSupplier} />
      <h2>Daftar Supplier</h2>
      <TabelSupplier rows={data || []} />
    </div>
  );
}
