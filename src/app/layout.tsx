import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { createAuthServerClient } from "@/lib/auth/server";
import { supabaseServer } from "@/lib/supabase-server";

export const metadata = { title: "Risako ERP", description: "Sistem Manajemen Toko" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const authSupabase = await createAuthServerClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  
  let role = null;
  if (user?.email) {
    const { data: emp } = await supabaseServer
      .from("employees")
      .select("role")
      .eq("email", user.email)
      .single();
      
    role = emp?.role || "owner"; 
  }

  return (
    <html lang="id">
      <body>
        <Sidebar role={role} />
        <div className="main-content">
          {children}
        </div>
      </body>
    </html>
  );
}
