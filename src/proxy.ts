import { NextResponse, type NextRequest } from "next/server";

/**
 * Pemeriksaan optimistis: halaman aplikasi tanpa cookie sesi langsung
 * dialihkan ke /login?returnTo=... . Validasi sesungguhnya (dekripsi,
 * kedaluwarsa, refresh, peran) dilakukan di Route Handler & backend.
 */
const SESSION_COOKIES = ["__Host-dpm_session", "dpm_session"];

export function proxy(request: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (hasSession) return NextResponse.next();

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  if (returnTo !== "/") loginUrl.searchParams.set("returnTo", returnTo);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Semua halaman kecuali /login, /api, aset Next.js, dan file statis.
  matcher: ["/((?!login|api|_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|svg|ico|webp|css|js|map)$).*)"],
};
