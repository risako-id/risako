import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const appSecret = process.env.TIKTOK_APP_SECRET;

  if (!supabaseUrl || !supabaseServiceKey || !appSecret) {
    return NextResponse.json({ error: 'Environment variables belum lengkap' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Ambil raw body dan signature untuk verifikasi
    const rawBody = await request.text();
    const signatureHeader = request.headers.get('Authorization');

    if (!signatureHeader) {
      return NextResponse.json({ error: 'Missing signature header' }, { status: 401 });
    }

    // 2. Verifikasi Signature (HMAC-SHA256)
    // Format header TikTok biasanya: "sha256=xxxxxx" atau hanya hash-nya saja
    const signature = signatureHeader.replace('sha256=', '');
    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    
    // 3. Cek Tipe Event (Kita hanya peduli pada perubahan status pesanan)
    // Catatan: Angka '1' ini adalah tipe event untuk Order Status Change. 
    // Pastikan Anda sudah men-subscribe topik ini di TikTok Partner Center.
    if (payload.type !== 1) {
      return NextResponse.json({ message: 'Event ignored' }, { status: 200 });
    }

    const eventData = payload.data;
    const orderId = eventData.order_id;
    const orderStatus = eventData.order_status;

    // 4. Cek Idempotency (Mencegah pemrosesan ganda)
    // Menggunakan notification_id dari TikTok sebagai external_event_id
    const { data: logData, error: logError } = await supabase
      .from('webhook_logs')
      .insert({ 
        external_event_id: payload.notification_id, 
        status: 'processing' 
      })
      .select()
      .single();

    // Jika error karena unique constraint (berarti webhook ini sudah pernah diproses), abaikan.
    if (logError) {
      if (logError.code === '23505') {
        return NextResponse.json({ message: 'Duplicate event ignored' }, { status: 200 });
      }
      throw logError;
    }

    // 5. Logika Bisnis: Hanya potong stok jika status "Ready to Ship" (atau status spesifik TikTok)
    // CATATAN: Anda perlu menyesuaikan string status ini dengan dokumentasi TikTok.
    // Biasanya statusnya berupa string seperti "AWAITING_SHIPMENT", "READY_TO_SHIP", "SHIPPED", dll.
    if (orderStatus === 'READY_TO_SHIP') {
      
      // Dapatkan store_id dari tabel tiktok_tokens (asumsi 1 toko untuk saat ini)
      const { data: tokenData } = await supabase.from('tiktok_tokens').select('shop_id').limit(1).single();
      if (!tokenData) throw new Error("Toko TikTok belum terhubung");

      // Dapatkan ID Platform TikTok
      const { data: platformData } = await supabase.from('platforms').select('id').eq('name', 'tiktok').single();
      if (!platformData) throw new Error("Platform TikTok belum ada di database");

      // Buat catatan pesanan utama
      const { data: orderData, error: orderError } = await supabase
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

    // 6. Update status log menjadi 'processed'
    await supabase.from('webhook_logs').update({ status: 'processed' }).eq('id', logData.id);

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err: any) {
    console.error('Webhook Error:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
