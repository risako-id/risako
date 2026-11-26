import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

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

    const expectedSignature = crypto.createHmac('sha256', appSecret).update(appKey + rawBody).digest('hex');
    const isValid = crypto.timingSafeEqual(Buffer.from(signatureHeader || '', 'utf8'), Buffer.from(expectedSignature, 'utf8'));

    if (!isValid) return new NextResponse('Invalid signature', { status: 401 });

    const payload = JSON.parse(rawBody);

    if (!payload.data || !payload.data.order_id) return new NextResponse(null, { status: 200 });

    const eventData = payload.data;
    const orderId = eventData.order_id;
    const orderStatus = eventData.order_status; 

    const notificationId = payload.tts_notification_id || `fallback-${orderId}-${Date.now()}`;
    const { data: logData, error: logError } = await supabase
      .from('webhook_logs')
      .insert({ external_event_id: notificationId, status: 'processing' })
      .select()
      .single();

    if (logError) {
      if (logError.code === '23505') return new NextResponse(null, { status: 200 }); 
      throw logError;
    }
    
    logId = logData.id; 

    const { data: tokenData } = await supabase.from('tiktok_tokens').select('access_token, shop_cipher').limit(1).single();
    if (!tokenData || !tokenData.shop_cipher) throw new Error("Token atau Shop Cipher tidak valid");

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

    const { data: platformData } = await supabase.from('platforms').select('id').eq('name', 'tiktok').single();
    if (!platformData) throw new Error("Platform TikTok belum ada di database");

    // --- 1. SIMPAN / UPDATE DATA PESANAN ---
    let { data: existingOrder } = await supabase.from('orders').select('id, status').eq('external_order_id', orderId).maybeSingle();
    let orderData = existingOrder;

    if (!orderData) {
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          store_id: '22222222-2222-2222-2222-222222222222', 
          platform_id: platformData.id,
          external_order_id: orderId,
          status: orderStatus,
          total_amount: parseFloat(orderDataAPI.payment?.total_amount) || 0
        }).select().single();
      
      if (orderError) throw new Error(`Gagal insert order: ${orderError.message}`);
      orderData = newOrder;
    } else if (orderData.status !== orderStatus) {
      const { error: updateOrderError } = await supabase
        .from('orders')
        .update({ status: orderStatus, updated_at: new Date().toISOString() })
        .eq('id', orderData.id);
        
      if (updateOrderError) throw new Error(`Gagal update status order: ${updateOrderError.message}`);
    }

    // --- INI TAMBAHAN UNTUK MEMPERBAIKI ERROR TYPESCRIPT VERCEL ---
    if (!orderData) {
      throw new Error("Gagal mendapatkan atau membuat data pesanan (orderData null)");
    }
    // -------------------------------------------------------------

    // --- 2. SIMPAN ITEM PESANAN ---
    for (const item of lineItems) {
      const sellerSku = item.seller_sku || item.sku_id; 
      const qty = item.quantity || 1; 

      const { data: mappingData } = await supabase.from('channel_skus').select('sku_id').eq('external_sku_id', sellerSku).maybeSingle();
      if (!mappingData) {
        await supabase.from('webhook_logs').update({ status: `ERROR_SKU: ${sellerSku}` }).eq('id', logId);
        continue; 
      }

      const { data: existingItem } = await supabase.from('order_items').select('id').eq('order_id', orderData.id).eq('external_sku_id', sellerSku).maybeSingle();
      
      if (!existingItem) {
        const { error: insertItemError } = await supabase.from('order_items').insert({
          order_id: orderData.id,
          sku_id: mappingData.sku_id,
          external_sku_id: sellerSku,
          quantity: qty,
          unit_price: parseFloat(item.sale_price) || 0 
        });

        if (insertItemError) throw new Error(`Gagal insert order_item (${sellerSku}): ${insertItemError.message}`);
      }
    }

    // --- 3. POTONG STOK (HANYA JIKA STATUS "SHIPPED") ---
    const isReadyToShip = ['SHIPPED'].includes(orderStatus);

    if (isReadyToShip) {
      const { data: checkMovement } = await supabase.from('stock_movements')
        .select('id')
        .like('note', `%${orderId}%`)
        .limit(1)
        .maybeSingle();

      if (!checkMovement) {
        const { data: currentOrderItems } = await supabase.from('order_items').select('id, sku_id, quantity').eq('order_id', orderData.id);
        
        if (currentOrderItems) {
          for (const item of currentOrderItems) {
            const { error: movementError } = await supabase.from('stock_movements').insert({
              sku_id: item.sku_id,
              movement_type: 'sale', 
              qty_change: -item.quantity,
              order_item_id: item.id,
              note: `Penjualan TikTok: ${orderId}`
            });

            if (movementError) throw new Error(`Gagal insert mutasi stok: ${movementError.message}`);

            const { data: packRecipes } = await supabase.from('recipe_packagings')
              .select('packaging_material_id, quantity_needed')
              .eq('sku_id', item.sku_id);
            
            if (packRecipes && packRecipes.length > 0) {
              for (const pr of packRecipes) {
                await supabase.from('packaging_movements').insert({
                  packaging_material_id: pr.packaging_material_id,
                  movement_type: 'used',
                  qty_change: -(Number(pr.quantity_needed) * item.quantity),
                  order_id: orderData.id,
                  note: `Packing TikTok: ${orderId}`
                });
              }
            }
          }
        }
      }
    }

    await supabase.from('webhook_logs').update({ status: 'processed' }).eq('id', logId);
    return new NextResponse(null, { status: 200 });

  } catch (err: any) {
    console.error('Webhook Error:', err);
    if (logId) {
      await supabase.from('webhook_logs')
        .update({ status: `CRASH: ${err.message.substring(0, 100)}` })
        .eq('id', logId);
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
