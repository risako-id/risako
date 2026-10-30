import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // SEMENTARA DIMATIKAN UNTUK PENGUJIAN UI DI HP
  // Nanti akan diganti dengan Supabase Auth (Session Login)
  return NextResponse.next();
}

export const config = {
  // Biarkan konfigurasi ini agar middleware tetap berjalan di background
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
