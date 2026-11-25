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
    // 1. Ambil raw body sebagai text, bukan JSON
    const rawBody = await request.text();
    const signatureHeader = request.headers.get('Authorization');

    if (!signatureHeader) {
      return new NextResponse('Missing signature', { status: 401 });
    }

    // 2. Hitung signature yang diharapkan
    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(appKey + rawBody) // Rumus: app_key + rawBody
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

    // 5. Jika ini hanya tes verifikasi, balas dengan 200 dan body kosong
    if (!payload.data || !payload.data.order_id) {
      return new NextResponse(null, { status: 200 });
    }

    // --- Logika pemrosesan order (bisa dilanjutkan nanti) ---
    // (salin logika order dari kode sebelumnya ke sini)

    // 6. Selalu kembalikan 200 kosong jika berhasil
    return new NextResponse(null, { status: 200 });

  } catch (err: any) {
    console.error('Webhook Error:', err);
    // Jangan kembalikan 500 jika error terjadi saat parsing JSON,
    // karena TikTok akan menganggapnya gagal.
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
