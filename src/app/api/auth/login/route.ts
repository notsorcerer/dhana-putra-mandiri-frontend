import { NextResponse, type NextRequest } from "next/server";
import { randomToken } from "@/lib/server/crypto";
import { buildAuthorizationUrl, createPkcePair } from "@/lib/server/oidc";
import { safeReturnTo, writeTransaction } from "@/lib/server/session";
import { authConfig } from "@/lib/server/config";

/**
 * GET /api/auth/login?returnTo=/path
 * Memulai OAuth 2.0 Authorization Code Flow + PKCE (S256).
 * state, nonce, dan code_verifier disimpan di cookie HttpOnly terenkripsi.
 */
export async function GET(request: NextRequest) {
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"));
  try {
    const state = randomToken(32);
    const nonce = randomToken(32);
    const { verifier, challenge } = createPkcePair();
    const url = await buildAuthorizationUrl({ state, nonce, codeChallenge: challenge });
    const res = NextResponse.redirect(url, 303);
    res.headers.set("Cache-Control", "no-store");
    writeTransaction(res, { state, nonce, verifier, returnTo });
    return res;
  } catch (error) {
    console.error("[auth] gagal memulai login:", error instanceof Error ? error.message : error);
    return NextResponse.redirect(new URL("/login?error=idp_unavailable", authConfig().appBaseUrl), 303);
  }
}
