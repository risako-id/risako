import { SupabaseClient } from '@supabase/supabase-js';

// Fungsi untuk memastikan token selalu valid (auto-refresh)
export async function getValidTikTokToken(
  supabase: SupabaseClient,
  shopId: string,
  appKey: string,
  appSecret: string
) {
  // 1. Ambil data token dari database berdasarkan shop_id
  const { data: tokenData, error: tokenError } = await supabase
    .from('tiktok_tokens')
    .select('*')
    .eq('shop_id', shopId)
    .single();

  if (tokenError || !tokenData) {
    throw new Error(`Token tidak ditemukan untuk shop_id: ${shopId}`);
  }

  const now = new Date();
  const expiresAt = new Date(tokenData.access_expires_at);
  
  // 2. Cek: Apakah token akan expired dalam 1 jam ke depan? (3600000 ms)
  // Kita pakai buffer 1 jam agar aman jika webhook masuk pas detik-detik akhir
  const bufferTime = 60 * 60 * 1000; 
  
  if (expiresAt.getTime() - now.getTime() < bufferTime) {
    // --- PROSES REFRESH TOKEN ---
    const refreshUrl = new URL('https://auth.tiktok-shops.com/api/v2/token/refresh');
    refreshUrl.searchParams.append('app_key', appKey);
    refreshUrl.searchParams.append('app_secret', appSecret);
    refreshUrl.searchParams.append('refresh_token', tokenData.refresh_token);
    refreshUrl.searchParams.append('grant_type', 'refresh_token');

    const res = await fetch(refreshUrl.toString(), { method: 'GET' });
    const refreshData = await res.json();

    if (refreshData.code !== 0) {
      throw new Error(`Gagal refresh token TikTok: ${refreshData.message}`);
    }

    const newToken = refreshData.data;
    
    // Hitung tanggal expired baru
    const newExpiresAt = new Date(Date.now() + newToken.access_token_expire_in * 1000).toISOString();
    const newRefreshExpiresAt = new Date(Date.now() + newToken.refresh_token_expire_in * 1000).toISOString();

    // Simpan token baru ke database
    const { error: updateError } = await supabase
      .from('tiktok_tokens')
      .update({
        access_token: newToken.access_token,
        refresh_token: newToken.refresh_token, // TikTok selalu merotasi refresh token
        access_expires_at: newExpiresAt,
        refresh_expires_at: newRefreshExpiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('shop_id', shopId);

    if (updateError) {
      throw new Error(`Gagal update token baru ke database: ${updateError.message}`);
    }

    // Kembalikan token yang baru
    return {
      access_token: newToken.access_token,
      shop_cipher: tokenData.shop_cipher,
      store_id: tokenData.store_id
    };
  }

  // 3. Jika token masih lama, langsung kembalikan token yang ada di database
  return {
    access_token: tokenData.access_token,
    shop_cipher: tokenData.shop_cipher,
    store_id: tokenData.store_id
  };
}
