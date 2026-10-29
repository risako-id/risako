import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Hanya dipakai di sisi server (server component / server action / API route).
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});
