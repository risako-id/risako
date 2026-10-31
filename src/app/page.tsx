import { supabaseServer } from "@/lib/supabase-server";
import { getCurrentEmployee } from "@/lib/auth/role";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const currentEmployee = await getCurrentEmployee();

  // 1. Ambil Data Kas
  const { data: txs } = await supabaseServer.from("cash_transactions").select("type, amount");
  const totalIn = txs?.filter(t => t.type === 'in').reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
  const totalOut = txs?.filter(t => t.type === 'out').reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
  const saldoKas = totalIn - totalOut;

  // 2. Ambil Data Stok Menipis (Bahan Baku, Kemasan, Produk)
  const [rmRes, pkgRes, skuRes] = await Promise.all([
    supabaseServer.from("raw_materials").select("id, name, stock_qty, min_stock, unit"),
    supabaseServer.from("packaging_materials").select("id, name, stock_qty, min_stock, unit"),
    supabaseServer.from("skus").select("id, sku_code, stock_qty, min_stock, products(name)")
  ]);

  const lowRawMaterials = (rmRes.data || []).filter(i => Number(i.stock_qty) <= Number(i.min_stock) && Number(i.min_stock) > 0);
  const lowPackagings = (pkgRes.data || []).filter(i => Number(i.stock_qty) <= Number(i.min_stock) && Number(i.min_stock) > 0);
  const lowSkus = (skuRes.data || []).filter(i => Number(i.stock_qty) <= Number(i.min_stock) && Number(i.min_stock) > 0);

  // 3. Ambil Produksi Pending (Menunggu Validasi)
  const { count: pendingProductions } = await supabaseServer
    .from("production_orders")
    .select("*", { count: 'exact', head: true })
    .eq("status", "pending");

  const totalLowStock = lowRawMaterials.length + lowPackagings.length + lowSkus.length;

  return (
    <div>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        Halo, {currentEmployee?.name || "Owner"}! 👋
      </h1>
      <p style={{ color: '#666', marginTop: '-10px', marginBottom: '30px' }}>Ini adalah ringkasan toko Anda hari ini.</p>

      {/* WIDGET RINGKASAN */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        {/* KARTU KAS */}
        <div className="card" style={{ borderLeft: '4px solid #2e7d32', margin: 0 }}>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem', fontWeight: 'bold' }}>Saldo Kas Toko</p>
          <h2 style={{ margin: '10px 0 0 0', fontSize: '2rem', color: '#2e7d32' }}>Rp {saldoKas.toLocaleString('id-ID')}</h2>
        </div>

        {/* KARTU PRODUKSI PENDING */}
        <div className="card" style={{ borderLeft: '4px solid #f57c00', margin: 0 }}>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem', fontWeight: 'bold' }}>Produksi Menunggu QC</p>
          <h2 style={{ margin: '10px 0 0 0', fontSize: '2rem', color: '#f57c00' }}>{pendingProductions || 0} Batch</h2>
        </div>

        {/* KARTU STOK MENIPIS */}
        <div className="card" style={{ borderLeft: '4px solid #c62828', margin: 0 }}>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem', fontWeight: 'bold' }}>Barang Stok Menipis</p>
          <h2 style={{ margin: '10px 0 0 0', fontSize: '2rem', color: '#c62828' }}>{totalLowStock} Item</h2>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {/* DETAIL STOK MENIPIS */}
        {totalLowStock > 0 && (
          <div className="card" style={{ flex: 1, minWidth: '300px' }}>
            <h3 style={{ marginTop: 0, color: '#c62828' }}>⚠️ Peringatan Stok Menipis</h3>
            <ul style={{ paddingLeft: '20px', color: '#444' }}>
              {lowRawMaterials.map(r => <li key={r.id}>{r.name} (Sisa: {r.stock_qty} {r.unit})</li>)}
              {lowPackagings.map(p => <li key={p.id}>{p.name} (Sisa: {p.stock_qty} {p.unit})</li>)}
              {lowSkus.map(s => <li key={s.id}>{(s.products as any)?.name} - {s.sku_code} (Sisa: {s.stock_qty} pcs)</li>)}
            </ul>
          </div>
        )}

        {/* SHORTCUT MENU */}
        <div className="card" style={{ flex: 1, minWidth: '300px' }}>
          <h3 style={{ marginTop: 0 }}>Akses Cepat</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link href="/produksi" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '12px', background: '#f0f0f0', borderRadius: '6px', color: '#333', fontWeight: 'bold' }}>👨‍🍳 Lapor Hasil Produksi</div>
            </Link>
            <Link href="/validasi" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '12px', background: '#f0f0f0', borderRadius: '6px', color: '#333', fontWeight: 'bold' }}>✅ Validasi QC</div>
            </Link>
            <Link href="/pembelian" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '12px', background: '#f0f0f0', borderRadius: '6px', color: '#333', fontWeight: 'bold' }}>🛒 Catat Pembelian</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
