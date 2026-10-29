# Risako

Aplikasi stok & keuangan toko (Next.js + Supabase + Vercel).

## Jalankan di komputer
1. `npm install`
2. Salin `.env.example` jadi `.env.local`, isi 3 nilainya.
3. `npm run dev` lalu buka http://localhost:3000

## Deploy
Hubungkan repo ini ke Vercel, lalu isi Environment Variables yang sama
(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, APP_PASSWORD).

## Database
SQL ada di `supabase/migrations/`. `001` sudah dijalankan; `002` hanya bila ada error permission.
