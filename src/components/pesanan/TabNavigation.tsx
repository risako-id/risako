import Link from "next/link";

export default function TabNavigation({ activeTab }: { activeTab: string }) {
  const tabStyle = (tabName: string, color: string) => ({
    padding: '10px 20px', textDecoration: 'none', fontWeight: activeTab === tabName ? 'bold' : 'normal', 
    borderBottom: activeTab === tabName ? `3px solid ${color}` : 'none', 
    color: activeTab === tabName ? color : '#666',
    transition: 'all 0.2s'
  });

  return (
    <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #eee', marginBottom: '20px', marginTop: '20px' }}>
      <Link href="/pesanan?tab=logistik" style={tabStyle('logistik', '#1976d2')}>🚚 Pesanan & Logistik</Link>
      <Link href="/pesanan?tab=terbayar" style={tabStyle('terbayar', '#2e7d32')}>💰 Terbayar (Settled)</Link>
    </div>
  );
}
