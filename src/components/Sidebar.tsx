"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const pathname = usePathname();

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

  return (
    <>
      <div className="mobile-header">
        <button onClick={() => setIsOpen(!isOpen)} className="hamburger-btn">☰</button>
        <h2 style={{ color: '#fff', margin: 0, fontSize: '1.2rem' }}>Risako ERP</h2>
      </div>

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <h2 style={{ color: 'white', marginTop: 0, marginBottom: '20px' }}>Risako ERP</h2>
        
        <nav style={{ display: 'flex', flexDirection: 'column' }}>
          <Link href="/" style={linkStyle("/")}>📊 Dashboard</Link>

          <div onClick={() => toggleMenu('inventori')} style={groupTitleStyle(['/produk', '/bahan-baku', '/kemasan'])}>
            <span>📦 Inventori</span>
            <span>{openMenus.includes('inventori') ? '▼' : '▶'}</span>
          </div>
          {openMenus.includes('inventori') && (
            <div style={{ marginBottom: '5px' }}>
              <Link href="/produk" style={subLinkStyle("/produk")}>Produk Jadi</Link>
              <Link href="/bahan-baku" style={subLinkStyle("/bahan-baku")}>Bahan Baku</Link>
              <Link href="/kemasan" style={subLinkStyle("/kemasan")}>Kemasan</Link>
            </div>
          )}

          <div onClick={() => toggleMenu('produksi')} style={groupTitleStyle(['/resep', '/produksi'])}>
            <span>👨‍🍳 Produksi</span>
            <span>{openMenus.includes('produksi') ? '▼' : '▶'}</span>
          </div>
          {openMenus.includes('produksi') && (
            <div style={{ marginBottom: '5px' }}>
              <Link href="/resep" style={subLinkStyle("/resep")}>Resep (BOM)</Link>
              <Link href="/produksi" style={subLinkStyle("/produksi")}>Lapor Produksi</Link>
            </div>
          )}

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

          <Link href="/keuangan" style={linkStyle("/keuangan")}>💰 Keuangan</Link>
        </nav>
      </aside>

      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)} />}
    </>
  );
}
