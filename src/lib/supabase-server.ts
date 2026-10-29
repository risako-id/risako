import { createClient } from "@supabase/supabase-js";

// File ini HANYA boleh di-import oleh Server Component, Server Action, atau API Route.
// Jangan pernah meng-import file ini di komponen yang pakai "use client".
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { persistSession: false } }
);
