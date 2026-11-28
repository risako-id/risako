import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { getValidTikTokToken } from '@/lib/tiktok';

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

export async function POST(request: Request) {
  const appKey = process.env.TIKTOK_APP_KEY;
  const appSecret = process.env.TIKTOK_APP_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!appKey || !appSecret || !supabaseUrl || !supabaseServiceKey) {
    return new NextResponse('Missing environment variables', { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let logId: string | null = null;

  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get('Authorization');

    if (!signatureHeader) {
      return new NextResponse('Missing signature', { status: 401 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(appKey + rawBody)
      .digest('hex');

    const signatureBuffer = Buffer.from(signatureHeader, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return new NextResponse('Invalid signature', { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    if (!payload?.data?.order_id) {
      return new NextResponse(null, { status: 200 });
    }

    const eventData = payload.data;
    const orderId = String(eventData.order_id);
    const orderStatus = eventData.order_status
      ? String(eventData.order_status)
      : null;

    const shopIdRaw = payload.shop_id || eventData.shop_id;
    const shopId = shopIdRaw ? String(shopIdRaw) : null;

    const notificationId =
      payload.tts_notification_id ||
      `fallback-${orderId}-${orderStatus || 'UNKNOWN'}`;

    if (
      orderStatus &&
      ['UNPAID', 'AWAITING_SHIPMENT'].includes(orderStatus)
    ) {
      await supabase.from('webhook_logs').upsert(
        {
          external_event_id: notificationId,
          status: `SKIP_STATUS: ${orderStatus}`,
        },
        {
          onConflict: 'external_event_id',
          ignoreDuplicates: true,
        }
      );

      return new NextResponse(null, { status: 200 });
    }

    if (!shopId) {
      throw new Error('Shop ID tidak ditemukan di payload webhook');
    }

    const { data: logData, error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        external_event_id: notificationId,
        status: 'processing',
      })
      .select()
      .single();

    if (logError) {
      if (logError.code === '23505') {
        const { data: existingLog } = await supabase
          .from('webhook_logs')
          .select('id, status')
          .eq('external_event_id', notificationId)
          .maybeSingle();

        if (!existingLog) {
          return new NextResponse(null, { status: 200 });
        }

        const existingStatus = existingLog.status || '';

        if (
          existingStatus === 'processed' ||
          existingStatus.startsWith('SKIP_STATUS')
        ) {
          return new NextResponse(null, { status: 200 });
        }

        if (
          existingStatus.startsWith('CRASH') ||
          existingStatus.startsWith('ERROR') ||
          existingStatus.startsWith('PARTIAL')
        ) {
          logId = existingLog.id;

          await supabase
            .from('webhook_logs')
            .update({ status: 'processing' })
            .eq('id', logId);
        } else {
          return new NextResponse(null, { status: 200 });
        }
      } else {
        throw logError;
      }
    } else {
      logId = logData.id;
    }

    const tokenData = await getValidTikTokToken(
      supabase,
      shopId,
      appKey,
      appSecret
    );

    if (!tokenData.shop_cipher) {
      throw new Error(`Shop Cipher kosong untuk Shop ID: ${shopId}`);
    }

    if (!tokenData.store_id) {
      await supabase
        .from('webhook_logs')
        .update({
          status: `ERROR_STORE_MAPPING: ${shopId}`,
        })
        .eq('id', logId);

      return new NextResponse('Store mapping missing', { status: 500 });
    }

    const storeId = tokenData.store_id;

    const { data: platformData, error: platformError } = await supabase
      .from('platforms')
      .select('id')
      .eq('name', 'tiktok')
      .single();

    if (platformError || !platformData) {
      throw new Error('Platform TikTok belum ada di database');
    }

    const platformId = platformData.id;

    const path = '/order/202507/orders';
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const params: Record<string, string> = {
      app_key: appKey,
      timestamp,
      ids: orderId,
      shop_cipher: tokenData.shop_cipher,
    };

    const sign = generateTikTokSignature(path, params, appSecret);
    params.sign = sign;

    const queryString = new URLSearchParams(params).toString();
    const url = `https://open-api.tiktokglobalshop.com${path}?${queryString}`;

    const orderDetailsResponse = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'x-tts-access-token': tokenData.access_token,
        'Content-Type': 'application/json',
      },
    });

    if (!orderDetailsResponse.ok) {
      const errText = await orderDetailsResponse.text();
      throw new Error(
        `Gagal ambil detail pesanan: ${errText.substring(0, 200)}`
      );
    }

    const orderDetails = await orderDetailsResponse.json();

    if (orderDetails.code !== 0) {
      throw new Error(`TikTok API error: ${orderDetails.message}`);
    }

    const orderDataAPI = orderDetails.data?.orders?.[0];

    if (!orderDataAPI) {
      throw new Error('Data pesanan tidak ditemukan di API TikTok');
    }

    const lineItems = orderDataAPI.line_items || [];

    if (lineItems.length === 0) {
      await supabase
        .from('webhook_logs')
        .update({ status: 'ERROR_LINE_ITEMS_KOSONG' })
        .eq('id', logId);

      return new NextResponse(null, { status: 200 });
    }

    const effectiveStatus = orderDataAPI.status
      ? String(orderDataAPI.status)
      : orderStatus;

    if (!effectiveStatus) {
      throw new Error('Status pesanan tidak diketahui');
    }

    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, status')
      .eq('store_id', storeId)
      .eq('platform_id', platformId)
      .eq('external_order_id', orderId)
      .maybeSingle();

    let orderData = existingOrder;

    if (!orderData) {
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          store_id: storeId,
          platform_id: platformId,
          external_order_id: orderId,
          status: effectiveStatus,
          total_amount:
            parseFloat(orderDataAPI.payment?.total_amount) || 0,
          ordered_at: orderDataAPI.create_time
            ? new Date(Number(orderDataAPI.create_time) * 1000).toISOString()
            : null,
        })
        .select()
        .single();

      if (orderError) {
        throw new Error(`Gagal insert order: ${orderError.message}`);
      }

      orderData = newOrder;
    } else if (orderData.status !== effectiveStatus) {
      const { error: updateOrderError } = await supabase
        .from('orders')
        .update({
          status: effectiveStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderData.id);

      if (updateOrderError) {
        throw new Error(
          `Gagal update status order: ${updateOrderError.message}`
        );
      }
    }

    if (!orderData) {
      throw new Error('Gagal mendapatkan data pesanan');
    }

    const skuErrors: string[] = [];

    for (const item of lineItems) {
      const candidateKeys = [item.seller_sku, item.sku_id]
        .filter(Boolean)
        .map(String);

      const qty = Number(item.quantity) || 1;

      let mappingData: any = null;
      let matchedExternalSku: string | null = null;

      for (const key of candidateKeys) {
        const { data: mapping } = await supabase
          .from('channel_skus')
          .select('sku_id')
          .eq('store_id', storeId)
          .eq('platform_id', platformId)
          .eq('external_sku_id', key)
          .maybeSingle();

        if (mapping) {
          mappingData = mapping;
          matchedExternalSku = key;
          break;
        }
      }

      if (!mappingData || !matchedExternalSku) {
        skuErrors.push(candidateKeys.join('/') || 'UNKNOWN');
        continue;
      }

      const { data: skuData } = await supabase
        .from('skus')
        .select('cost_price')
        .eq('id', mappingData.sku_id)
        .maybeSingle();

      const historicalCost = Number(skuData?.cost_price ?? 0);

      const { data: existingItem } = await supabase
        .from('order_items')
        .select('id')
        .eq('order_id', orderData.id)
        .eq('external_sku_id', matchedExternalSku)
        .maybeSingle();

      if (!existingItem) {
        const { error: insertItemError } = await supabase
          .from('order_items')
          .insert({
            order_id: orderData.id,
            sku_id: mappingData.sku_id,
            external_sku_id: matchedExternalSku,
            quantity: qty,
            unit_price: parseFloat(item.sale_price) || 0,
            historical_cost: historicalCost,
            store_id: storeId,
          });

        if (insertItemError) {
          throw new Error(
            `Gagal insert order_item (${matchedExternalSku}): ${insertItemError.message}`
          );
        }
      }
    }

    if (effectiveStatus === 'AWAITING_COLLECTION') {
      const { data: currentOrderItems } = await supabase
        .from('order_items')
        .select('id, sku_id, quantity')
        .eq('order_id', orderData.id);

      if (currentOrderItems) {
        for (const item of currentOrderItems) {
          if (!item.sku_id) continue;

          const { data: existingMovement } = await supabase
            .from('stock_movements')
            .select('id')
            .eq('order_item_id', item.id)
            .eq('movement_type', 'sale')
            .maybeSingle();

          if (existingMovement) {
            continue;
          }

          const { error: movementError } = await supabase
            .from('stock_movements')
            .insert({
              sku_id: item.sku_id,
              movement_type: 'sale',
              qty_change: -item.quantity,
              order_item_id: item.id,
              note: `Penjualan TikTok: ${orderId}`,
            });

          if (movementError) {
            throw new Error(
              `Gagal insert mutasi stok: ${movementError.message}`
            );
          }

          const { data: packRecipes, error: packRecipeError } = await supabase
            .from('recipe_packagings')
            .select('packaging_material_id, quantity_needed')
            .eq('sku_id', item.sku_id);

          if (!packRecipeError && packRecipes && packRecipes.length > 0) {
            for (const pr of packRecipes) {
              await supabase.from('packaging_movements').insert({
                packaging_material_id: pr.packaging_material_id,
                movement_type: 'used',
                qty_change: -(Number(pr.quantity_needed) * item.quantity),
                order_id: orderData.id,
                note: `Packing TikTok: ${orderId}`,
              });
            }
          }
        }
      }
    }

    const finalStatus =
      skuErrors.length > 0
        ? `PARTIAL_SKU: ${skuErrors.join(',').substring(0, 100)}`
        : 'processed';

    await supabase
      .from('webhook_logs')
      .update({ status: finalStatus })
      .eq('id', logId);

    return new NextResponse(null, { status: 200 });
  } catch (err: any) {
    console.error('Webhook Error:', err);

    if (logId) {
      await supabase
        .from('webhook_logs')
        .update({
          status: `CRASH: ${String(err.message).substring(0, 100)}`,
        })
        .eq('id', logId);
    }

    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
