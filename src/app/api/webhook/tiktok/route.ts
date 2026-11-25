import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(request: Request) {
  const appKey = process.env.TIKTOK_APP_KEY;
  const appSecret = process.env.TIKTOK_APP_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!appKey || !appSecret || !supabaseUrl || !supabaseServiceKey) {
    return new NextResponse('Missing environment variables', { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Ambil raw body sebagai text untuk verifikasi signature
    const rawBody = await request.text();
    const signatureHeader = request.headers.get('Authorization');

    if (!signatureHeader) {
      return new NextResponse('Missing signature', { status: 401 });
    }

    // 2. Hitung signature yang diharapkan (HMAC-SHA256 dari app_key + rawBody)
    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(appKey + rawBody)
      .digest('hex');

    // 3. Bandingkan signature dengan aman
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signatureHeader || '', 'utf8'),
      Buffer.from(expectedSignature, 'utf8')
    );

    if (!isValid) {
      return new NextResponse('Invalid signature', { status: 401 });
    }

    // 4. Parse body HANYA setelah signature valid
    const payload = JSON.parse(rawBody);

    // 5. Jika ini hanya tes verifikasi (tidak ada data order), balas 200 kosong
    if (!payload.data || !payload.data.order_id) {
      return new NextResponse(null, { status: 200 });
    }

    // 6. Cek Tipe Event (Kita hanya peduli pada Order Status Change, tipe 1)
    if (payload.type !== 1) {
      return new NextResponse(null, { status: 200 });
    }

    const eventData = payload.data;
    const orderId = eventData.order_id;
    const orderStatus = eventData.order_status;

    // 7. Cek Idempotency (Mencegah pemrosesan ganda)
    const { data: logData, error: logError } = await supabase
      .from('webhook_logs')
      .insert({ 
        external_event_id: payload.notification_id, 
        status: 'processing' 
      })
      .select()
      .single();

    if (logError) {
      // Jika error karena unique constraint (23505), berarti webhook ini sudah pernah diproses
      if (logError.code === '23505') {
        return new NextResponse(null, { status: 200 });
      }
      throw logError;
    }

    // 8. Logika Bisnis: Potong stok jika status sesuai
    // Menangkap status dari Sandbox (AWAITING_COLLECTION) dan Production (READY_TO_SHIP)
    if (orderStatus === 'READY_TO_SHIP' || orderStatus === 'AWAITING_COLLECTION' || orderStatus === 'AWAITING_SHIPMENT') {
      
      // Ambil store_id dari tabel tiktok_tokens (asumsi 1 toko)
      const { data: tokenData } = await supabase.from('tiktok_tokens').select('shop_id').limit(1).single();
      if (!tokenData) throw new Error("Toko TikTok belum terhubung");

      // Ambil ID Platform TikTok
      const { data: platformData } = await supabase.from('platforms').select('id').eq('name', 'tiktok').single();
      if (!platformData) throw new Error("Platform TikTok belum ada di database");

      // Cek apakah order sudah ada di database (mencegah duplikasi order)
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('external_order_id', orderId)
        .single();

      let orderData = existingOrder;

      // Jika belum ada, buat catatan pesanan utama
      if (!orderData) {
        const { data: newOrder, error: orderError } = await supabase
          .from('orders')
          .insert({
            store_id: '22222222-2222-2222-2222-222222222222', // Ganti dengan store_id dinamis nanti
            platform_id: platformData.id,
            external_order_id: orderId,
            status: orderStatus,
            total_amount: eventData.payment_info?.total_amount || 0
          })
          .select()
          .single();

        if (orderError) throw orderError;
        orderData = newOrder;
      }

      // Loop melalui item yang dibeli
      for (const item of eventData.line_items) {
        const sellerSku = item.sku_id; // Asumsi sku_id di payload adalah SKU Penjual (DUMMY-001)
        const qty = item.quantity;

        // Cari SKU Induk berdasarkan mapping channel_skus
        const { data: mappingData } = await supabase
          .from('channel_skus')
          .select('sku_id')
          .eq('external_sku_id', sellerSku)
          .single();

        if (!mappingData) {
          console.error(`Mapping SKU tidak ditemukan untuk: ${sellerSku}`);
          continue; // Lanjut ke item berikutnya jika SKU tidak terdaftar
        }

        // Cek apakah item ini sudah pernah diproses untuk order ini
        const { data: existingItem } = await supabase
          .from('order_items')
          .select('id')
          .eq('order_id', orderData.id)
          .eq('external_sku_id', sellerSku)
          .single();

        if (existingItem) continue; // Skip jika sudah ada

        // 1. Catat item pesanan
        await supabase.from('order_items').insert({
          order_id: orderData.id,
          sku_id: mappingData.sku_id,
          external_sku_id: sellerSku,
          quantity: qty,
          unit_price: item.sale_price || 0
        });

        // 2. Potong Stok Induk
        // CATATAN: Di production, gunakan fungsi RPC Supabase untuk atomic decrement
        const { data: skuData } = await supabase.from('skus').select('stock_qty').eq('id', mappingData.sku_id).single();
        if (skuData) {
          const newStock = skuData.stock_qty - qty;
          await supabase.from('skus').update({ stock_qty: newStock }).eq('id', mappingData.sku_id);

          // 3. Catat pergerakan stok
          await supabase.from('stock_movements').insert({
            sku_id: mappingData.sku_id,
            movement_type: 'OUT', // Pastikan ENUM ini ada di database Anda
            qty_change: -qty,
            note: `Penjualan TikTok Order ID: ${orderId}`
          });
        }
      }
    }

    // 9. Update status log menjadi 'processed'
    await supabase.from('webhook_logs').update({ status: 'processed' }).eq('id', logData.id);

    return new NextResponse(null, { status: 200 });

  } catch (err: any) {
    console.error('Webhook Error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
