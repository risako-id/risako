import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function generateTikTokSignature(path: string, params: Record<string, string>, appSecret: string): string {
  const sortedKeys = Object.keys(params).sort();
  let signString = appSecret + path;
  for (const key of sortedKeys) { signString += key + params[key]; }
  signString += appSecret;
  return crypto.createHmac('sha256', appSecret).update(signString).digest('hex');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) return NextResponse.json({ error: `TikTok Error: ${error}` }, { status: 400 });
  if (!code) return NextResponse.json({ error: 'Kode otorisasi tidak ditemukan' }, { status: 400 });

  const appKey = process.env.TIKTOK_APP_KEY;
  const appSecret = process.env.TIKTOK_APP_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!appKey || !appSecret || !supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Environment variables belum lengkap' }, { status: 500 });
  }

  const authUrl = new URL('https://auth.tiktok-shops.com/api/v2/token/get');
  authUrl.searchParams.append('app_key', appKey);
  authUrl.searchParams.append('app_secret', appSecret);
  authUrl.searchParams.append('auth_code', code);
  authUrl.searchParams.append('grant_type', 'authorized_code');

  try {
    const response = await fetch(authUrl.toString(), { method: 'GET' });
    const data = await response.json();

    if (data.code !== 0) {
      return NextResponse.json({ error: 'Gagal menukar token', details: data.message }, { status: 400 });
    }

    const tokenData = data.data;
    const accessToken = tokenData.access_token;

    const path = '/authorization/202309/shops';
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const params: Record<string, string> = { app_key: appKey, timestamp: timestamp };
    const sign = generateTikTokSignature(path, params, appSecret);
    
    const shopUrl = new URL(`https://open-api.tiktokglobalshop.com${path}`);
    shopUrl.searchParams.append('app_key', appKey);
    shopUrl.searchParams.append('timestamp', timestamp);
    shopUrl.searchParams.append('sign', sign);

    const shopResponse = await fetch(shopUrl.toString(), {
      method: 'GET',
      headers: { 'x-tts-access-token': accessToken, 'Content-Type': 'application/json' }
    });

    const shopData = await shopResponse.json();
    
    let shopCipher = null;
    let shopId = tokenData.open_id;
    
    if (shopData.code === 0 && shopData.data.shops && shopData.data.shops.length > 0) {
      shopCipher = shopData.data.shops[0].cipher;
      shopId = shopData.data.shops[0].id;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // CELAH/ASUMSI: Mengambil store pertama di ERP. 
    // Nanti jika UI multi-toko sudah jadi, ini harus diganti dengan ID toko yang dipilih saat klik Connect.
    const { data: defaultStore } = await supabase.from('stores').select('id').limit(1).single();

    const { error: dbError } = await supabase
      .from('tiktok_tokens')
      .upsert({
        shop_id: shopId, 
        store_id: defaultStore?.id, // <-- MENYIMPAN STORE ID
        access_token: accessToken,
        refresh_token: tokenData.refresh_token,
        shop_cipher: shopCipher, 
        access_expires_at: new Date(Date.now() + tokenData.access_token_expire_in * 1000).toISOString(),
        refresh_expires_at: new Date(Date.now() + tokenData.refresh_token_expire_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'shop_id' });

    if (dbError) {
      return NextResponse.json({ error: 'Gagal menyimpan token', details: dbError.message }, { status: 500 });
    }

    return new NextResponse(`
      <html><body style="font-family: sans-serif; text-align: center; padding: 2rem;">
      <h1 style="color: green;">✅ Otorisasi Berhasil!</h1>
      <p>Aplikasi Risako sudah terhubung dengan TikTok Shop.</p>
      <p>Shop Cipher: ${shopCipher ? 'Berhasil didapatkan' : 'Gagal didapatkan (Cek Log)'}</p>
      </body></html>`, { status: 200, headers: { 'Content-Type': 'text/html' } });

  } catch (err: any) {
    return NextResponse.json({ error: 'Kesalahan internal', details: err.message }, { status: 500 });
  }
}
