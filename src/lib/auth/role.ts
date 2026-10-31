import { createAuthServerClient } from "./server";
import { supabaseServer } from "../supabase-server";

export async function getCurrentRole() {
  const authSupabase = await createAuthServerClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  
  if (!user?.email) return null;

  const { data: emp } = await supabaseServer
    .from("employees")
    .select("role")
    .eq("email", user.email)
    .single();
    
  return emp?.role || null;
}
