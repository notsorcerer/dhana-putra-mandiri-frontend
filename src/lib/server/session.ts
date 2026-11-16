/**
 * Sesi BFF berbasis cookie HttpOnly terenkripsi (AES-256-GCM).
 *
 * - Access/refresh/ID token TIDAK pernah dikirim ke JavaScript browser.
 * - Cookie: HttpOnly, SameSite=Lax, Secure (wajib di production), Path=/,
 *   prefiks `__Host-` saat Secure agar tidak bisa di-set oleh subdomain.
 * - Isi sesi > ~3,8 KB dipecah ke beberapa cookie (`name`, `name.1`, ...).
 * - Refresh token dirotasi; refresh paralel dari request bersamaan
 *   di-dedupe agar rotasi refresh token tidak membatalkan sesi.
 */

import type { NextRequest, NextResponse } from "next/server";
import { authConfig } from "./config";
import { seal, unseal } from "./crypto";
import { claimAtPath, decodeJwtPayload, OidcError, refreshTokens, type TokenResponse } from "./oidc";

export const APP_ROLES = ["direktur", "admin", "gudang", "stakeholder"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export interface SessionUser {
  sub: string;
  username: string;
  name: string;
  email: string | null;
  roles: AppRole[];
}

export interface StoredSession {
  v: 1;
  accessToken: string;
  accessExpiresAt: number; // epoch detik
  refreshToken?: string;
  refreshExpiresAt?: number;
  idToken?: string;
  user: SessionUser;
  createdAt: number;
}

interface OAuthTransaction {
  state: string;
  nonce: string;
  verifier: string;
  returnTo: string;
  createdAt: number;
}

const SESSION_PURPOSE = "session";
const TX_PURPOSE = "oauth-tx";
const CHUNK_SIZE = 3800;
const MAX_CHUNKS = 6;
const REFRESH_SKEW_SECONDS = 30;
const MAX_SESSION_SECONDS = 12 * 60 * 60;
export const TX_MAX_AGE_SECONDS = 10 * 60;

type CookieReader = Pick<NextRequest["cookies"], "get" | "getAll">;

function cookiePrefix(): string {
  return authConfig().cookieSecure ? "__Host-" : "";
}

export function sessionCookieName(): string {
  return `${cookiePrefix()}dpm_session`;
}

function txCookieName(): string {
  return `${cookiePrefix()}dpm_oauth_tx`;
}

function baseCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: authConfig().cookieSecure,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

const now = () => Math.floor(Date.now() / 1000);

// ------------------------------------------------------------ OAuth transaction

export function safeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  if (value.startsWith("/api/") || value.startsWith("/login")) return "/";
  return value;
}

export function writeTransaction(res: NextResponse, tx: Omit<OAuthTransaction, "createdAt">): void {
  res.cookies.set(txCookieName(), seal(TX_PURPOSE, { ...tx, createdAt: now() }), baseCookieOptions(TX_MAX_AGE_SECONDS));
}

export function readTransaction(cookies: CookieReader): OAuthTransaction | null {
  const tx = unseal<OAuthTransaction>(TX_PURPOSE, cookies.get(txCookieName())?.value);
  if (!tx || now() - tx.createdAt > TX_MAX_AGE_SECONDS) return null;
  return tx;
}

export function clearTransaction(res: NextResponse): void {
  res.cookies.set(txCookieName(), "", baseCookieOptions(0));
}

// ------------------------------------------------------------ Session cookie

export function readSession(cookies: CookieReader): StoredSession | null {
  const name = sessionCookieName();
  const first = cookies.get(name)?.value;
  if (!first) return null;
  let sealed = first;
  for (let i = 1; i < MAX_CHUNKS; i++) {
    const part = cookies.get(`${name}.${i}`)?.value;
    if (!part) break;
    sealed += part;
  }
  const session = unseal<StoredSession>(SESSION_PURPOSE, sealed);
  if (!session || session.v !== 1) return null;
  const hardExpiry = Math.max(session.refreshExpiresAt ?? 0, session.accessExpiresAt);
  if (hardExpiry <= now() || now() - session.createdAt > MAX_SESSION_SECONDS) return null;
  return session;
}

export function writeSession(res: NextResponse, cookies: CookieReader, session: StoredSession): void {
  const name = sessionCookieName();
  const sealed = seal(SESSION_PURPOSE, session);
  const chunks: string[] = [];
  for (let i = 0; i < sealed.length; i += CHUNK_SIZE) chunks.push(sealed.slice(i, i + CHUNK_SIZE));
  if (chunks.length > MAX_CHUNKS) throw new Error("Sesi terlalu besar untuk disimpan di cookie.");

  const expiry = Math.min(
    Math.max(session.refreshExpiresAt ?? 0, session.accessExpiresAt),
    session.createdAt + MAX_SESSION_SECONDS,
  );
  const maxAge = Math.max(expiry - now(), 0);
  chunks.forEach((chunk, i) => res.cookies.set(i === 0 ? name : `${name}.${i}`, chunk, baseCookieOptions(maxAge)));
  // Hapus sisa chunk lama bila sesi baru lebih kecil.
  for (let i = chunks.length; i < MAX_CHUNKS; i++) {
    if (cookies.get(`${name}.${i}`)) res.cookies.set(`${name}.${i}`, "", baseCookieOptions(0));
  }
}

export function clearSession(res: NextResponse, cookies: CookieReader): void {
  const name = sessionCookieName();
  res.cookies.set(name, "", baseCookieOptions(0));
  for (let i = 1; i < MAX_CHUNKS; i++) {
    if (cookies.get(`${name}.${i}`)) res.cookies.set(`${name}.${i}`, "", baseCookieOptions(0));
  }
}

// ------------------------------------------------------------ Token -> session

export function rolesFromAccessToken(accessToken: string): AppRole[] {
  const claims = decodeJwtPayload(accessToken);
  const found = new Set<AppRole>();
  for (const path of authConfig().roleClaimPaths) {
    const value = claimAtPath(claims, path);
    const list = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
    for (const role of list) {
      if ((APP_ROLES as readonly string[]).includes(role)) found.add(role as AppRole);
    }
  }
  return APP_ROLES.filter((r) => found.has(r));
}

export function sessionFromTokens(
  tokens: TokenResponse,
  idClaims: Record<string, unknown> | null,
  previous?: StoredSession,
): StoredSession {
  const t = now();
  const at = decodeJwtPayload(tokens.access_token);
  const profile = idClaims ?? at;
  const str = (v: unknown) => (typeof v === "string" && v ? v : null);
  const username = str(profile.preferred_username) ?? str(at.preferred_username) ?? String(at.sub);
  return {
    v: 1,
    accessToken: tokens.access_token,
    accessExpiresAt: typeof at.exp === "number" ? at.exp : t + tokens.expires_in,
    refreshToken: tokens.refresh_token ?? previous?.refreshToken,
    refreshExpiresAt: tokens.refresh_expires_in
      ? t + tokens.refresh_expires_in
      : tokens.refresh_token
        ? undefined
        : previous?.refreshExpiresAt,
    idToken: tokens.id_token ?? previous?.idToken,
    user: {
      sub: String(at.sub ?? profile.sub),
      username,
      name: str(profile.name) ?? username,
      email: str(profile.email),
      roles: rolesFromAccessToken(tokens.access_token),
    },
    createdAt: previous?.createdAt ?? t,
  };
}

// ------------------------------------------------------------ Refresh (dedupe)

const inflight = new Map<string, Promise<TokenResponse>>();
const recentlyRotated = new Map<string, { tokens: TokenResponse; at: number }>();
const ROTATION_GRACE_MS = 60_000;

async function refreshOnce(refreshToken: string): Promise<TokenResponse> {
  const recent = recentlyRotated.get(refreshToken);
  if (recent && Date.now() - recent.at < ROTATION_GRACE_MS) return recent.tokens;
  let pending = inflight.get(refreshToken);
  if (!pending) {
    pending = refreshTokens(refreshToken)
      .then((tokens) => {
        recentlyRotated.set(refreshToken, { tokens, at: Date.now() });
        for (const [key, value] of recentlyRotated) {
          if (Date.now() - value.at > ROTATION_GRACE_MS) recentlyRotated.delete(key);
        }
        return tokens;
      })
      .finally(() => inflight.delete(refreshToken));
    inflight.set(refreshToken, pending);
  }
  return pending;
}

export type SessionResult =
  | { status: "valid"; session: StoredSession; refreshed: boolean }
  | { status: "none" }
  | { status: "expired" }
  | { status: "unavailable" };

/** Ambil sesi dan refresh access token bila (hampir) kedaluwarsa. */
export async function getActiveSession(cookies: CookieReader, forceRefresh = false): Promise<SessionResult> {
  const session = readSession(cookies);
  if (!session) return { status: cookies.get(sessionCookieName()) ? "expired" : "none" };

  const needsRefresh = forceRefresh || session.accessExpiresAt - REFRESH_SKEW_SECONDS <= now();
  if (!needsRefresh) return { status: "valid", session, refreshed: false };
  if (!session.refreshToken || (session.refreshExpiresAt && session.refreshExpiresAt <= now())) {
    return { status: "expired" };
  }
  try {
    const tokens = await refreshOnce(session.refreshToken);
    return { status: "valid", session: sessionFromTokens(tokens, null, session), refreshed: true };
  } catch (error) {
    // invalid_grant dsb. = refresh token dicabut/kedaluwarsa -> sesi berakhir.
    if (error instanceof OidcError && error.code !== "idp_http_error") return { status: "expired" };
    console.error("[auth] refresh token gagal:", error instanceof Error ? error.message : error);
    return { status: "unavailable" };
  }
}
