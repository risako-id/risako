import { createClient } from "@supabase/supabase-js";

// Hanya dipakai di sisi server (server component / server action / API route).
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
