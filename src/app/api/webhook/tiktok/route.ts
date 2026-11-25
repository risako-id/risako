import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const appKey = process.env.TIKTOK_APP_KEY;
  const appSecret = process.env.TIKTOK_APP_SECRET;

  if (!supabaseUrl || !supabaseServiceKey || !appKey || !appSecret) {
    return new NextResponse('Missing environment variables', { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get('Authorization');

    if (!signatureHeader) {
      return new NextResponse('Missing signature', { status: 401 });
    }

    // Rumus signature TikTok: HMAC-SHA256 dari (app_key + rawBody) dengan app_secret
    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(appKey + rawBody)
      .digest('hex');

    // Bandingkan signature (gunakan perbandingan yang aman)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signatureHeader || '', 'utf8'),
      Buffer.from(expectedSignature, 'utf8')
    );

    if (!isValid) {
      return new NextResponse('Invalid signature', { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    // Jika ini hanya tes verifikasi dari TikTok (tidak ada data order), balas 200 kosong
    if (!payload.data || !payload.data.order_id) {
      return new NextResponse(null, { status: 200 });
    }

    // --- Logika pemrosesan order (sama seperti sebelumnya) ---
    // (salin logika order dari kode sebelumnya ke sini)

    return new NextResponse(null, { status: 200 });

  } catch (err: any) {
    console.error('Webhook Error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
