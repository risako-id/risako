"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";

export default function Sidebar({ role }: { role: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const pathname = usePathname();

  if (pathname === "/login") return null;

  const toggleMenu = (menu: string) => {
    setOpenMenus(prev => 
      prev.includes(menu) ? prev.filter(m => m !== menu) : [...prev, menu]
    );
  };

  const isActive = (path: string) => pathname === path;
  const isGroupActive = (paths: string[]) => paths.some(p => pathname.startsWith(p));

  const linkStyle = (path: string) => ({
    display: 'block', padding: '10px 15px', color: isActive(path) ? '#fff' : '#aaa', 
    textDecoration: 'none', background: isActive(path) ? '#333' : 'transparent', 
    borderRadius: '6px', marginBottom: '4px'
  });

  const subLinkStyle = (path: string) => ({
    ...linkStyle(path), paddingLeft: '30px', fontSize: '0.9rem'
  });

  const groupTitleStyle = (paths: string[]) => ({
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', 
    color: isGroupActive(paths) ? '#fff' : '#aaa', cursor: 'pointer', borderRadius: '6px', 
    marginBottom: '4px', background: isGroupActive(paths) ? '#2a2a2a' : 'transparent'
  });

  const isOwner = role === "owner";
  const isProduksi = role === "produksi";
  const isPenjualan = role === "penjualan";

  return (
    <>
      <div className="mobile-header">
        <button onClick={() => setIsOpen(!isOpen)} className="hamburger-btn">☰</button>
        <h2 style={{ color: '#fff', margin: 0, fontSize: '1.2rem' }}>Risako ERP</h2>
      </div>

      <aside className={`sidebar ${isOpen ? 'open' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ color: 'white', marginTop: 0, marginBottom: '20px' }}>Risako ERP</h2>
        
        <nav style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <Link href="/" style={linkStyle("/")}>📊 Dashboard</Link>

          {/* MENU INVENTORI */}
          {(isOwner || isProduksi || isPenjualan) && (
            <>
              <div onClick={() => toggleMenu('inventori')} style={groupTitleStyle(['/produk', '/bahan-baku', '/kemasan', '/pembelian', '/supplier'])}>
                <span>📦 Inventori</span>
                <span>{openMenus.includes('inventori') ? '▼' : '▶'}</span>
              </div>
              {openMenus.includes('inventori') && (
                <div style={{ marginBottom: '5px' }}>
                  <Link href="/produk" style={subLinkStyle("/produk")}>Produk Jadi</Link>
                  <Link href="/bahan-baku" style={subLinkStyle("/bahan-baku")}>Bahan Baku</Link>
                  <Link href="/kemasan" style={subLinkStyle("/kemasan")}>Kemasan</Link>
                  {isOwner && <Link href="/supplier" style={subLinkStyle("/supplier")}>Supplier</Link>}
                  {isOwner && <Link href="/pembelian" style={subLinkStyle("/pembelian")}>Pembelian</Link>}
                </div>
              )}
            </>
          )}

          {/* MENU PRODUKSI */}
          {(isOwner || isProduksi) && (
            <>
              <div onClick={() => toggleMenu('produksi')} style={groupTitleStyle(['/resep', '/produksi', '/validasi'])}>
                <span>👨‍🍳 Produksi</span>
                <span>{openMenus.includes('produksi') ? '▼' : '▶'}</span>
              </div>
              {openMenus.includes('produksi') && (
                <div style={{ marginBottom: '5px' }}>
                  <Link href="/resep" style={subLinkStyle("/resep")}>Resep (BOM)</Link>
                  <Link href="/produksi" style={subLinkStyle("/produksi")}>Lapor Produksi</Link>
                  {(isOwner || isPenjualan) && <Link href="/validasi" style={subLinkStyle("/validasi")}>Validasi QC</Link>}
                </div>
              )}
            </>
          )}

          {/* MENU PENJUALAN */}
          {(isOwner || isPenjualan) && (
            <>
              <div onClick={() => toggleMenu('penjualan')} style={groupTitleStyle(['/kasir', '/pesanan'])}>
                <span>🛒 Penjualan</span>
                <span>{openMenus.includes('penjualan') ? '▼' : '▶'}</span>
              </div>
              {openMenus.includes('penjualan') && (
                <div style={{ marginBottom: '5px' }}>
                  <Link href="/pesanan" style={subLinkStyle("/pesanan")}>Pesanan Online</Link>
                  <Link href="/kasir" style={subLinkStyle("/kasir")}>Kasir Offline</Link>
                </div>
              )}
            </>
          )}

          {/* MENU KHUSUS OWNER */}
          {isOwner && (
            <>
              <Link href="/karyawan" style={linkStyle("/karyawan")}>👥 Karyawan</Link>
              
              <div onClick={() => toggleMenu('keuangan')} style={groupTitleStyle(['/keuangan', '/payroll', '/laporan', '/dompet', '/hutang'])}>
                <span>💰 Keuangan</span>
                <span>{openMenus.includes('keuangan') ? '▼' : '▶'}</span>
              </div>
              {openMenus.includes('keuangan') && (
                <div style={{ marginBottom: '5px' }}>
                  <Link href="/dompet" style={subLinkStyle("/dompet")}>Dompet & Bank</Link>
                  <Link href="/keuangan" style={subLinkStyle("/keuangan")}>Arus Kas</Link>
                  <Link href="/hutang" style={subLinkStyle("/hutang")}>Hutang Supplier</Link>
                  <Link href="/payroll" style={subLinkStyle("/payroll")}>Rekap Upah</Link>
                  <Link href="/laporan" style={subLinkStyle("/laporan")}>Laporan Laba</Link>
                </div>
              )}
            </>
          )}
        </nav>

        {/* MENU PROFIL & LOGOUT */}
        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #333' }}>
          <Link href="/profil" style={{ 
            display: 'block', padding: '10px', color: '#fff', textDecoration: 'none', 
            background: '#444', borderRadius: '6px', marginBottom: '10px', 
            textAlign: 'center', fontWeight: 'bold' 
          }}>
            👤 Profil Saya
          </Link>
          
          <form action={logout}>
            <button type="submit" style={{ width: '100%', background: '#c62828', color: 'white' }}>
              Logout
            </button>
          </form>
        </div>
      </aside>

      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)} />}
    </>
  );
}
