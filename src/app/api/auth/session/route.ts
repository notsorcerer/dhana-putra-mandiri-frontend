import { NextResponse, type NextRequest } from "next/server";
import { clearSession, getActiveSession, writeSession } from "@/lib/server/session";

/**
 * GET /api/auth/session
 * Pemulihan sesi untuk UI: profil & peran pengguna (tanpa token).
 * Me-refresh access token bila hampir kedaluwarsa.
 */
export async function GET(request: NextRequest) {
  const result = await getActiveSession(request.cookies);
  const headers = { "Cache-Control": "no-store" };

  if (result.status === "unavailable") {
    return NextResponse.json({ authenticated: false, reason: "idp_unavailable" }, { status: 503, headers });
  }
  if (result.status !== "valid") {
    const res = NextResponse.json({ authenticated: false, reason: result.status }, { status: 401, headers });
    if (result.status === "expired") clearSession(res, request.cookies);
    return res;
  }

  const { session } = result;
  const res = NextResponse.json(
    {
      authenticated: true,
      user: session.user,
      accessExpiresAt: session.accessExpiresAt,
      refreshExpiresAt: session.refreshExpiresAt ?? null,
    },
    { status: session.user.roles.length ? 200 : 403, headers },
  );
  if (result.refreshed) writeSession(res, request.cookies, session);
  return res;
}
