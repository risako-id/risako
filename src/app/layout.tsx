import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata = { title: "Risako ERP", description: "Sistem Manajemen Toko" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <Sidebar />
        <div className="main-content">
          {children}
        </div>
      </body>
    </html>
  );
}
