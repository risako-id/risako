import { supabaseServer } from "@/lib/supabase-server";
import { tambahKaryawan } from "./actions";
import FormKaryawan from "@/components/karyawan/FormKaryawan";
import TabelKaryawan from "@/components/karyawan/TabelKaryawan";

export const dynamic = "force-dynamic";

export default async function KaryawanPage() {
  const { data, error } = await supabaseServer
    .from("employees")
    .select("id, name, role, commission_rate")
    .order("created_at", { ascending: false });

  if (error) return <div className="card text-red">Error: {error.message}</div>;

  return (
    <div>
      <h1>Manajemen Karyawan</h1>
      <FormKaryawan action={tambahKaryawan} />
      <h2>Daftar Karyawan</h2>
      <TabelKaryawan rows={data || []} />
    </div>
  );
}
