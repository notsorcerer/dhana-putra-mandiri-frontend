import { NextResponse, type NextRequest } from "next/server";
import { isSameOriginRequest } from "@/lib/server/csrf";
import { endSessionUrl, revokeRefreshToken } from "@/lib/server/oidc";
import { clearSession, readSession } from "@/lib/server/session";

/**
 * POST /api/auth/logout
 * Hapus sesi lokal, cabut refresh token, dan kembalikan URL RP-Initiated
 * Logout (end_session_endpoint) untuk mengakhiri sesi SSO di IdP.
 */
export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ detail: "Permintaan logout ditolak (CSRF)." }, { status: 403 });
  }
  const session = readSession(request.cookies);
  let redirectTo = "/login?logged_out=1";
  try {
    if (session?.refreshToken) await revokeRefreshToken(session.refreshToken);
    redirectTo = await endSessionUrl(session?.idToken);
  } catch (error) {
    console.error("[auth] logout IdP gagal:", error instanceof Error ? error.message : error);
  }
  const res = NextResponse.json({ redirectTo }, { headers: { "Cache-Control": "no-store" } });
  clearSession(res, request.cookies);
  return res;
}
