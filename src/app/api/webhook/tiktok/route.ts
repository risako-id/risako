import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Fungsi untuk generate signature API TikTok
function generateTikTokSignature(path: string, params: Record<string, string>, appSecret: string): string {
  const sortedKeys = Object.keys(params).sort();
  let signString = appSecret + path;
  for (const key of sortedKeys) {
    signString += key + params[key];
  }
  signString += appSecret;
  return crypto.createHmac('sha256', appSecret).update(signString).digest('hex');
}

export async function POST(request: Request) {
  const appKey = process.env.TIKTOK_APP_KEY;
  const appSecret = process.env.TIKTOK_APP_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!appKey || !appSecret || !supabaseUrl || !supabaseServiceKey) {
    return new NextResponse('Missing environment variables', { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  let logId = null; 

  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get('Authorization');

    if (!signatureHeader) return new NextResponse('Missing signature', { status: 401 });

    // Validasi Signature Webhook TikTok
    const expectedSignature = crypto.createHmac('sha256', appSecret).update(appKey + rawBody).digest('hex');
    const isValid = crypto.timingSafeEqual(Buffer.from(signatureHeader || '', 'utf8'), Buffer.from(expectedSignature, 'utf8'));

    if (!isValid) return new NextResponse('Invalid signature', { status: 401 });

    const payload = JSON.parse(rawBody);

    if (!payload.data || !payload.data.order_id) return new NextResponse(null, { status: 200 });

    const eventData = payload.data;
    const orderId = eventData.order_id;
    const orderStatus = eventData.order_status;

    // Mencegah duplikasi log
    const notificationId = payload.tts_notification_id || `fallback-${orderId}-${Date.now()}`;
    const { data: logData, error: logError } = await supabase
      .from('webhook_logs')
      .insert({ external_event_id: notificationId, status: 'processing' })
      .select()
      .single();

    if (logError) {
      if (logError.code === '23505') return new NextResponse(null, { status: 200 }); // Abaikan jika duplikat
      throw logError;
    }
    
    logId = logData.id; 

    // --- Ambil Token TikTok ---
    const { data: tokenData } = await supabase.from('tiktok_tokens').select('access_token, shop_cipher').limit(1).single();
    if (!tokenData || !tokenData.shop_cipher) throw new Error("Token atau Shop Cipher tidak valid");

    // --- Panggil API TikTok untuk ambil detail pesanan ---
    // CATATAN: Saya ubah versinya ke 202507 sesuai API Testing Tool terakhirmu
    const path = '/order/202507/orders'; 
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const params: Record<string, string> = { app_key: appKey, timestamp: timestamp, ids: orderId, shop_cipher: tokenData.shop_cipher };

    const sign = generateTikTokSignature(path, params, appSecret);
    params.sign = sign;

    const queryString = new URLSearchParams(params).toString();
    const url = `https://open-api.tiktokglobalshop.com${path}?${queryString}`;

    const orderDetailsResponse = await fetch(url, {
      method: 'GET',
      headers: { 'x-tts-access-token': tokenData.access_token, 'Content-Type': 'application/json' }
    });

    if (!orderDetailsResponse.ok) {
      const errText = await orderDetailsResponse.text();
      throw new Error(`Gagal ambil detail pesanan: ${errText}`);
    }

    const orderDetails = await orderDetailsResponse.json();
    const orderDataAPI = orderDetails.data.orders[0];

    if (!orderDataAPI) throw new Error("Data pesanan tidak ditemukan di API TikTok");

    const lineItems = orderDataAPI.line_items || [];
    
    if (lineItems.length === 0) {
      await supabase.from('webhook_logs').update({ status: 'ERROR_LINE_ITEMS_KOSONG' }).eq('id', logId);
      return new NextResponse(null, { status: 200 });
    }

    // --- Cek Platform di Database ---
    const { data: platformData } = await supabase.from('platforms').select('id').eq('name', 'tiktok').single();
    if (!platformData) throw new Error("Platform TikTok belum ada di database");

    // --- Cek atau Buat Order di Database ---
    let { data: existingOrder } = await supabase.from('orders').select('id').eq('external_order_id', orderId).maybeSingle();
    let orderData = existingOrder;

    if (!orderData) {
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          // TODO: Ganti hardcode store_id ini jika sistemmu sudah multi-store
          store_id: '22222222-2222-2222-2222-222222222222',
          platform_id: platformData.id,
          external_order_id: orderId,
          status: orderStatus,
          total_amount: parseFloat(orderDataAPI.payment?.total_amount) || 0
        }).select().single();
      
      if (orderError) throw new Error(`Gagal insert order: ${orderError.message}`);
      orderData = newOrder;
    }

    if (!orderData) throw new Error("Gagal membuat atau menemukan data pesanan");

    // --- PROSES LINE ITEMS & POTONG STOK ---
    for (const item of lineItems) {
      const sellerSku = item.seller_sku || item.sku_id; 
      
      // PERBAIKAN 1: Beri default 1 jika quantity tidak ada di JSON TikTok (mencegah NaN)
      const qty = item.quantity || 1; 

      // Cari relasi SKU TikTok ke SKU ERP
      const { data: mappingData } = await supabase.from('channel_skus').select('sku_id').eq('external_sku_id', sellerSku).maybeSingle();
      
      if (!mappingData) {
        await supabase.from('webhook_logs').update({ status: `ERROR_SKU: ${sellerSku}` }).eq('id', logId);
        continue; 
      }

      // Cek apakah item sudah pernah diproses sebelumnya (mencegah double stock reduction)
      const { data: existingItem } = await supabase.from('order_items').select('id').eq('order_id', orderData.id).eq('external_sku_id', sellerSku).maybeSingle();
      if (existingItem) continue;

      // PERBAIKAN 2: Tangkap error jika insert order_items gagal
      const { error: insertItemError } = await supabase.from('order_items').insert({
        order_id: orderData.id,
        sku_id: mappingData.sku_id,
        external_sku_id: sellerSku,
        quantity: qty,
        unit_price: parseFloat(item.sale_price) || 0 
      });

      if (insertItemError) {
        throw new Error(`Gagal insert order_item (${sellerSku}): ${insertItemError.message}`);
      }

      // Ambil stok saat ini
      const { data: skuData, error: skuError } = await supabase.from('skus').select('stock_qty').eq('id', mappingData.sku_id).single();
      
      if (skuError || !skuData) {
        throw new Error(`SKU ID ${mappingData.sku_id} tidak ditemukan di tabel skus.`);
      }

      // Kurangi stok
      const newStock = skuData.stock_qty - qty;
      const { error: updateStockError } = await supabase.from('skus').update({ stock_qty: newStock }).eq('id', mappingData.sku_id);
      
      if (updateStockError) {
        throw new Error(`Gagal update stok: ${updateStockError.message}`);
      }
      
      // Catat mutasi stok
      const { error: movementError } = await supabase.from('stock_movements').insert({
        sku_id: mappingData.sku_id,
        movement_type: 'OUT',
        qty_change: -qty,
        note: `Penjualan TikTok Order ID: ${orderId}`
      });

      if (movementError) {
        throw new Error(`Gagal insert mutasi stok: ${movementError.message}`);
      }
    }

    // Selesai tanpa error
    await supabase.from('webhook_logs').update({ status: 'processed' }).eq('id', logId);

    return new NextResponse(null, { status: 200 });

  } catch (err: any) {
    console.error('Webhook Error:', err);
    
    // Tulis error asli ke database agar bisa dibaca di tabel webhook_logs
    if (logId) {
      await supabase.from('webhook_logs')
        .update({ status: `CRASH: ${err.message.substring(0, 100)}` }) // Saya perpanjang jadi 100 karakter agar errornya lebih jelas
        .eq('id', logId);
    }
    
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
