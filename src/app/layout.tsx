import "./globals.css";

export const metadata = { title: "Risako", description: "Stok & keuangan toko" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
