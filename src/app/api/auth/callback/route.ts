import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/lib/server/config";
import { safeEqual } from "@/lib/server/crypto";
import { exchangeCode, verifyIdToken } from "@/lib/server/oidc";
import {
  clearTransaction,
  readTransaction,
  sessionFromTokens,
  writeSession,
} from "@/lib/server/session";

/**
 * GET /api/auth/callback?code=...&state=...
 * Redirect URI OAuth: validasi state, tukar code + code_verifier di
 * back-channel, verifikasi ID token (signature, iss, aud, nonce, exp),
 * lalu buat sesi cookie HttpOnly.
 */
export async function GET(request: NextRequest) {
  const cfg = authConfig();
  const params = request.nextUrl.searchParams;
  const fail = (code: string) => {
    const res = NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(code)}`, cfg.appBaseUrl), 303);
    clearTransaction(res);
    res.headers.set("Cache-Control", "no-store");
    return res;
  };

  const idpError = params.get("error");
  if (idpError) return fail(idpError === "access_denied" ? "access_denied" : "idp_error");

  const tx = readTransaction(request.cookies);
  const code = params.get("code");
  const state = params.get("state");
  if (!tx || !code || !state || !safeEqual(state, tx.state)) return fail("invalid_state");

  try {
    const tokens = await exchangeCode(code, tx.verifier);
    if (!tokens.id_token) return fail("missing_id_token");
    const idClaims = await verifyIdToken(tokens.id_token, tx.nonce);
    const session = sessionFromTokens(tokens, idClaims);
    if (session.user.sub !== idClaims.sub) return fail("subject_mismatch");

    const target = session.user.roles.length > 0 ? tx.returnTo : "/login?error=no_role";
    const res = NextResponse.redirect(new URL(target, cfg.appBaseUrl), 303);
    res.headers.set("Cache-Control", "no-store");
    clearTransaction(res);
    writeSession(res, request.cookies, session);
    return res;
  } catch (error) {
    console.error("[auth] callback gagal:", error instanceof Error ? error.message : error);
    return fail("callback_failed");
  }
}
