import "./globals.css";

export const metadata = { title: "Risako ERP", description: "Sistem Manajemen Toko" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body style={{ display: 'flex', minHeight: '100vh', margin: 0 }}>
        {/* SIDEBAR MENU */}
        <aside style={{ width: '250px', background: '#1a1a1a', color: 'white', padding: '20px', flexShrink: 0 }}>
          <h2 style={{ color: 'white', marginTop: 0, marginBottom: '30px' }}>Risako ERP</h2>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <a href="/" style={{ color: '#ccc', textDecoration: 'none' }}>📊 Dashboard</a>
            <a href="/produk" style={{ color: '#ccc', textDecoration: 'none' }}>📦 Produk</a>
            <a href="/bahan-baku" style={{ color: '#ccc', textDecoration: 'none' }}>🥩 Bahan Baku</a>
            <a href="/kemasan" style={{ color: '#ccc', textDecoration: 'none' }}>📦 Kemasan</a>
            <a href="/resep" style={{ color: '#ccc', textDecoration: 'none' }}>📝 Resep</a>
            <a href="/produksi" style={{ color: '#ccc', textDecoration: 'none' }}>👨‍🍳 Produksi</a>
            <hr style={{ borderColor: '#333', width: '100%' }} />
            <a href="/keuangan" style={{ color: '#ccc', textDecoration: 'none' }}>💰 Keuangan</a>
          </nav>
        </aside>

        {/* KONTEN UTAMA */}
        <div style={{ flex: 1, background: '#f6f7f9', padding: '30px', overflowY: 'auto' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
