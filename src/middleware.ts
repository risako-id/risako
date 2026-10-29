import { NextRequest, NextResponse } from "next/server";

// Pengaman sederhana: seluruh aplikasi dikunci dengan password (APP_PASSWORD).
export function middleware(req: NextRequest) {
  const pass = process.env.APP_PASSWORD;
  if (!pass) return new NextResponse("APP_PASSWORD belum diatur", { status: 500 });
  const h = req.headers.get("authorization");
  if (h?.startsWith("Basic ")) {
    const decoded = atob(h.slice(6));
    if (decoded.slice(decoded.indexOf(":") + 1) === pass) return NextResponse.next();
  }
  return new NextResponse("Login diperlukan", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Risako"' },
  });
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
