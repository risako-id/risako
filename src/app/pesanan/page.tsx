import { supabaseServer } from "@/lib/supabase-server";
import TabNavigation from "@/components/pesanan/TabNavigation";
import FilterLogistik from "@/components/pesanan/FilterLogistik";
import OrderTable from "@/components/pesanan/OrderTable";
import SaldoCard from "@/components/pesanan/SaldoCard";
import SettledTable from "@/components/pesanan/SettledTable";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PesananPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const activeTab = (resolvedSearchParams.tab as string) || "logistik";

  // Filter Logistik
  const statusFilter = (resolvedSearchParams.status as string) || "";
  const startDate = (resolvedSearchParams.startDate as string) || "";
  const endDate = (resolvedSearchParams.endDate as string) || "";
  const searchId = (resolvedSearchParams.searchId as string) || "";

  let orders: any[] = [];
  let settlements: any[] = [];
  let totalSettled = 0;
  let totalWithdrawn = 0;

  // --- FETCHING DATA BERDASARKAN TAB ---
  if (activeTab === "logistik") {
    // Ambil semua status kecuali UNPAID & AWAITING_SHIPMENT
    const allowedStatuses = ['AWAITING_COLLECTION', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'RETURNED', 'CANCELLED'];

    let query = supabaseServer
      .from("orders")
      .select(`id, external_order_id, status, created_at, total_amount, stores (name), order_items (quantity, skus (sku_code, products(name)))`)
      .in('status', allowedStatuses);

    if (statusFilter) query = query.eq('status', statusFilter);
    if (startDate) query = query.gte('created_at', `${startDate}T00:00:00Z`);
    if (endDate) query = query.lte('created_at', `${endDate}T23:59:59Z`);
    if (searchId) query = query.ilike('external_order_id', `%${searchId}%`);

    const { data } = await query.order("created_at", { ascending: false }).limit(50);
    orders = data || [];
  } 
  else if (activeTab === "terbayar") {
    // 1. Ambil data Settlements (Uang Masuk)
    const { data } = await supabaseServer
      .from("settlements")
      .select(`id, net_amount, settled_at, orders (external_order_id, stores(name))`)
      .order("settled_at", { ascending: false });
    
    settlements = data || [];
    totalSettled = settlements.reduce((sum, s) => sum + Number(s.net_amount), 0);

    // 2. Ambil data Withdrawals (Uang Keluar)
    const { data: withdrawals } = await supabaseServer.from("withdrawals").select("amount");
    totalWithdrawn = withdrawals?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;
  }

  const saldoVirtual = totalSettled - totalWithdrawn;

  return (
    <div>
      <h1>Pesanan Online</h1>
      
      <TabNavigation activeTab={activeTab} />

      {activeTab === "logistik" && (
        <>
          <FilterLogistik searchId={searchId} startDate={startDate} endDate={endDate} statusFilter={statusFilter} />
          <OrderTable orders={orders} />
        </>
      )}

      {activeTab === "terbayar" && (
        <>
          <SaldoCard saldoVirtual={saldoVirtual} totalWithdrawn={totalWithdrawn} />
          <SettledTable settlements={settlements} />
        </>
      )}
    </div>
  );
}
