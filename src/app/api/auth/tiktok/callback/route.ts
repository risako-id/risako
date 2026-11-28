import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function generateTikTokSignature(
  path: string,
  params: Record<string, string>,
  appSecret: string
): string {
  const sortedKeys = Object.keys(params).sort();
  let signString = appSecret + path;

  for (const key of sortedKeys) {
    signString += key + params[key];
  }

  signString += appSecret;

  return crypto
    .createHmac('sha256', appSecret)
    .update(signString)
    .digest('hex');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const rawStoreId = searchParams.get('store_id');
  const state = searchParams.get('state');
  const requestedStoreId =
    rawStoreId ||
    (state && /^[0-9a-fA-F-]{36}$/.test(state) ? state : null);

  if (error) {
    return NextResponse.json(
      { error: `TikTok Error: ${error}` },
      { status: 400 }
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: 'Kode otorisasi tidak ditemukan' },
      { status: 400 }
    );
  }

  const appKey = process.env.TIKTOK_APP_KEY;
  const appSecret = process.env.TIKTOK_APP_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!appKey || !appSecret || !supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Environment variables belum lengkap' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const authUrl = new URL('https://auth.tiktok-shops.com/api/v2/token/get');
    authUrl.searchParams.append('app_key', appKey);
    authUrl.searchParams.append('app_secret', appSecret);
    authUrl.searchParams.append('auth_code', code);
    authUrl.searchParams.append('grant_type', 'authorized_code');

    const response = await fetch(authUrl.toString(), {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Token exchange HTTP error: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== 0) {
      return NextResponse.json(
        { error: 'Gagal menukar token', details: data.message },
        { status: 400 }
      );
    }

    const tokenData = data.data;

    if (!tokenData?.access_token || !tokenData?.refresh_token) {
      throw new Error('Response token TikTok tidak lengkap');
    }

    const accessToken = tokenData.access_token;

    const path = '/authorization/202309/shops';
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const params: Record<string, string> = {
      app_key: appKey,
      timestamp,
    };

    const sign = generateTikTokSignature(path, params, appSecret);

    const shopUrl = new URL(`https://open-api.tiktokglobalshop.com${path}`);
    shopUrl.searchParams.append('app_key', appKey);
    shopUrl.searchParams.append('timestamp', timestamp);
    shopUrl.searchParams.append('sign', sign);

    const shopResponse = await fetch(shopUrl.toString(), {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'x-tts-access-token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!shopResponse.ok) {
      throw new Error(`Get Authorized Shops HTTP error: ${shopResponse.status}`);
    }

    const shopData = await shopResponse.json();

    if (shopData.code !== 0) {
      throw new Error(`Gagal mengambil shop TikTok: ${shopData.message}`);
    }

    const shops = shopData.data?.shops || [];

    if (shops.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada shop TikTok yang diotorisasi' },
        { status: 400 }
      );
    }

    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name');

    if (storesError) {
      throw new Error(`Gagal mengambil stores: ${storesError.message}`);
    }

    if (!stores || stores.length === 0) {
      return NextResponse.json(
        {
          error:
            'Belum ada store di ERP. Buat store terlebih dahulu sebelum connect TikTok.',
        },
        { status: 500 }
      );
    }

    let requestedStore: any = null;

    if (requestedStoreId) {
      requestedStore = stores.find((s: any) => s.id === requestedStoreId);

      if (!requestedStore) {
        return NextResponse.json(
          { error: `store_id tidak ditemukan di ERP: ${requestedStoreId}` },
          { status: 400 }
        );
      }
    }

    const results: any[] = [];

    for (const shop of shops) {
      const shopId = shop.id ? String(shop.id) : '';
      const shopCipher = shop.cipher || shop.shop_cipher || null;

      if (!shopId || !shopCipher) {
        results.push({
          shopId: shopId || '(kosong)',
          ok: false,
          storeId: null,
          error: 'shop_id atau shop_cipher kosong dari API TikTok',
        });
        continue;
      }

      const { data: existingToken } = await supabase
        .from('tiktok_tokens')
        .select('store_id')
        .eq('shop_id', shopId)
        .maybeSingle();

      let storeId: string | null = existingToken?.store_id || null;

      if (shops.length === 1) {
        if (requestedStore) {
          storeId = requestedStore.id;
        } else if (!storeId && stores.length === 1) {
          storeId = stores[0].id;
        }
      }

      const accessExpiresAt = tokenData.access_token_expire_in
        ? new Date(
            Date.now() + Number(tokenData.access_token_expire_in) * 1000
          ).toISOString()
        : null;

      const refreshExpiresAt = tokenData.refresh_token_expire_in
        ? new Date(
            Date.now() + Number(tokenData.refresh_token_expire_in) * 1000
          ).toISOString()
        : null;

      const { error: upsertError } = await supabase
        .from('tiktok_tokens')
        .upsert(
          {
            shop_id: shopId,
            store_id: storeId,
            access_token: accessToken,
            refresh_token: tokenData.refresh_token,
            shop_cipher: shopCipher,
            access_expires_at: accessExpiresAt,
            refresh_expires_at: refreshExpiresAt,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'shop_id' }
        );

      results.push({
        shopId,
        ok: !upsertError,
        storeId,
        error: upsertError?.message || null,
      });
    }

    const successResults = results.filter((r) => r.ok);

    if (successResults.length === 0) {
      return NextResponse.json(
        { error: 'Gagal menyimpan semua token TikTok', details: results },
        { status: 500 }
      );
    }

    const unmapped = successResults.filter((r) => !r.storeId);

    const rows = results
      .map((r) => {
        const storeCell = r.storeId
          ? escapeHtml(String(r.storeId))
          : '<b style="color:red;">BELUM MAPPING</b>';

        return `
          <tr>
            <td>${escapeHtml(String(r.shopId))}</td>
            <td>${r.ok ? '✅' : '❌'}</td>
            <td>${storeCell}</td>
            <td>${escapeHtml(String(r.error || ''))}</td>
          </tr>
        `;
      })
      .join('');

    const warning =
      unmapped.length > 0
        ? `
          <p style="color:red; font-weight:bold;">
            ⚠️ Ada ${unmapped.length} shop belum memiliki store_id.
            Webhook tidak akan memproses pesanan sampai mapping store_id diisi.
          </p>
        `
        : '';

    const multiShopWarning =
      shops.length > 1
        ? `
          <p style="color:orange;">
            ⚠️ Terdeteksi ${shops.length} shop dalam satu otorisasi.
            Pastikan mapping store_id per shop benar.
            Jangan asal assign semua shop ke satu toko yang sama.
          </p>
        `
        : '';

    return new NextResponse(
      `
      <html>
        <body style="font-family: sans-serif; padding: 2rem; max-width: 900px; margin: auto;">
          <h1 style="color: green;">✅ Otorisasi TikTok Berhasil</h1>
          <p>Aplikasi Risako sudah menerima token dari TikTok Shop.</p>

          <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
            <thead>
              <tr>
                <th>Shop ID</th>
                <th>Status Simpan</th>
                <th>Store ID ERP</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          ${warning}
          ${multiShopWarning}

          <p>
            Jika ada shop yang belum mapping, jalankan SQL mapping manual di Supabase
            atau buat UI connect per toko.
          </p>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  } catch (err: any) {
    console.error('TikTok Callback Error:', err);

    return NextResponse.json(
      { error: 'Kesalahan internal', details: err.message },
      { status: 500 }
    );
  }
}
