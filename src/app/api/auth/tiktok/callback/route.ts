import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.json({ error: `TikTok Error: ${error}` }, { status: 400 });
  }
  if (!code) {
    return NextResponse.json({ error: 'Kode otorisasi (code) tidak ditemukan di URL' }, { status: 400 });
  }

  const appKey = process.env.TIKTOK_APP_KEY;
  const appSecret = process.env.TIKTOK_APP_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!appKey || !appSecret || !supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Environment variables (TikTok / Supabase) belum lengkap' }, { status: 500 });
  }

  try {
    const response = await fetch('https://auth.tiktok-shops.com/api/v2/token/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_key: appKey,
        app_secret: appSecret,
        auth_code: code,
        grant_type: 'authorized_code',
      }),
    });

    // Tambahkan pengecekan response.ok untuk menangkap error HTTP
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ 
        error: 'TikTok API mengembalikan error HTTP', 
        status: response.status,
        details: errorText.substring(0, 500) // Tampilkan sebagian respons mentah
      }, { status: 502 });
    }

    const data = await response.json();

    if (data.code !== 0) {
      return NextResponse.json({ 
        error: 'Gagal menukar token dari TikTok', 
        details: data.message || data 
      }, { status: 400 });
    }

    const tokenData = data.data;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: dbError } = await supabase
      .from('tiktok_tokens')
      .upsert({
        shop_id: tokenData.open_id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        access_expires_at: new Date(Date.now() + tokenData.access_token_expire_in * 1000).toISOString(),
        refresh_expires_at: new Date(Date.now() + tokenData.refresh_token_expire_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'shop_id' });

    if (dbError) {
      return NextResponse.json({ 
        error: 'Gagal menyimpan token ke database Supabase', 
        details: dbError.message 
      }, { status: 500 });
    }

    return new NextResponse(`
      <html>
        <body style="font-family: sans-serif; padding: 2rem; text-align: center;">
          <h1 style="color: green;">✅ Otorisasi Berhasil!</h1>
          <p>Aplikasi Risako sudah terhubung dengan TikTok Shop.</p>
        </body>
      </html>
    `, { status: 200, headers: { 'Content-Type': 'text/html' } });

  } catch (err: any) {
    console.error('Error saat OAuth:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan internal server', details: err.message }, { status: 500 });
  }
}
