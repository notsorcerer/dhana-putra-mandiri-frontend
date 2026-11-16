/**
 * Klien OpenID Connect (Authorization Code Flow + PKCE S256) untuk BFF Next.js.
 * Tanpa dependensi eksternal: discovery, JWKS & verifikasi RS256 memakai node:crypto.
 */

import { createHash, createPublicKey, verify as verifySignature, type JsonWebKey } from "node:crypto";
import { authConfig, redirectUri } from "./config";
import { randomToken } from "./crypto";

interface DiscoveryDocument {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  end_session_endpoint?: string;
  revocation_endpoint?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  refresh_expires_in?: number;
  id_token?: string;
  scope?: string;
}

export class OidcError extends Error {
  constructor(
    message: string,
    public readonly code: string = "oidc_error",
  ) {
    super(message);
    this.name = "OidcError";
  }
}

const DISCOVERY_TTL_MS = 10 * 60 * 1000;
let discoveryCache: { doc: DiscoveryDocument; at: number } | null = null;
let jwksCache: { keys: (JsonWebKey & { kid?: string; alg?: string; use?: string })[]; at: number } | null = null;

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(8000) });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err = (data as { error?: string; error_description?: string } | null) ?? {};
    throw new OidcError(err.error_description || `Identity provider HTTP ${res.status}`, err.error || "idp_http_error");
  }
  return data as T;
}

export async function discovery(): Promise<DiscoveryDocument> {
  if (discoveryCache && Date.now() - discoveryCache.at < DISCOVERY_TTL_MS) return discoveryCache.doc;
  const { issuer } = authConfig();
  const doc = await fetchJson<DiscoveryDocument>(`${issuer}/.well-known/openid-configuration`);
  if (doc.issuer.replace(/\/+$/, "") !== issuer) {
    throw new OidcError("Issuer discovery tidak sesuai OIDC_ISSUER.", "issuer_mismatch");
  }
  discoveryCache = { doc, at: Date.now() };
  return doc;
}

// ---------------------------------------------------------------- PKCE

export function createPkcePair(): { verifier: string; challenge: string } {
  const verifier = randomToken(48); // 64 karakter base64url (RFC 7636: 43–128)
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export async function buildAuthorizationUrl(params: {
  state: string;
  nonce: string;
  codeChallenge: string;
}): Promise<string> {
  const cfg = authConfig();
  const doc = await discovery();
  const url = new URL(doc.authorization_endpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", cfg.clientId);
  url.searchParams.set("redirect_uri", redirectUri());
  url.searchParams.set("scope", cfg.scopes);
  url.searchParams.set("state", params.state);
  url.searchParams.set("nonce", params.nonce);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

// ---------------------------------------------------------------- Token endpoint

function clientAuthBody(body: URLSearchParams): URLSearchParams {
  const cfg = authConfig();
  body.set("client_id", cfg.clientId);
  if (cfg.clientSecret) body.set("client_secret", cfg.clientSecret);
  return body;
}

async function tokenRequest(body: URLSearchParams): Promise<TokenResponse> {
  const doc = await discovery();
  const tokens = await fetchJson<TokenResponse>(doc.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: clientAuthBody(body).toString(),
  });
  if (!tokens?.access_token || tokens.token_type?.toLowerCase() !== "bearer") {
    throw new OidcError("Respons token endpoint tidak valid.", "invalid_token_response");
  }
  return tokens;
}

export function exchangeCode(code: string, codeVerifier: string): Promise<TokenResponse> {
  return tokenRequest(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(),
      code_verifier: codeVerifier,
    }),
  );
}

export function refreshTokens(refreshToken: string): Promise<TokenResponse> {
  return tokenRequest(new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }));
}

export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  const doc = await discovery();
  if (!doc.revocation_endpoint) return;
  try {
    await fetch(doc.revocation_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: clientAuthBody(new URLSearchParams({ token: refreshToken, token_type_hint: "refresh_token" })).toString(),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // revokasi best-effort; sesi lokal tetap dihapus
  }
}

export async function endSessionUrl(idToken: string | undefined): Promise<string> {
  const cfg = authConfig();
  const doc = await discovery();
  const postLogout = `${cfg.appBaseUrl}${cfg.postLogoutRedirectPath}`;
  if (!doc.end_session_endpoint) return postLogout;
  const url = new URL(doc.end_session_endpoint);
  url.searchParams.set("client_id", cfg.clientId);
  url.searchParams.set("post_logout_redirect_uri", postLogout);
  if (idToken) url.searchParams.set("id_token_hint", idToken);
  return url.toString();
}

// ---------------------------------------------------------------- JWT helpers

export type JwtClaims = Record<string, unknown> & {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  iat?: number;
  nonce?: string;
  azp?: string;
};

function decodeSegment<T>(segment: string): T {
  return JSON.parse(Buffer.from(segment, "base64url").toString("utf8")) as T;
}

/** Decode payload TANPA verifikasi — hanya untuk token yang diterima langsung dari token endpoint (back-channel TLS). */
export function decodeJwtPayload(token: string): JwtClaims {
  const parts = token.split(".");
  if (parts.length !== 3) throw new OidcError("Format JWT tidak valid.", "invalid_jwt");
  return decodeSegment<JwtClaims>(parts[1]);
}

async function jwks(force = false) {
  if (!force && jwksCache && Date.now() - jwksCache.at < DISCOVERY_TTL_MS) return jwksCache.keys;
  const doc = await discovery();
  const data = await fetchJson<{ keys: NonNullable<typeof jwksCache>["keys"] }>(doc.jwks_uri);
  jwksCache = { keys: data.keys ?? [], at: Date.now() };
  return jwksCache.keys;
}

/** Verifikasi ID token (OIDC Core §3.1.3.7): signature RS256, iss, aud, azp, exp, iat, nonce. */
export async function verifyIdToken(idToken: string, expectedNonce: string): Promise<JwtClaims> {
  const cfg = authConfig();
  const [h, p, s] = idToken.split(".");
  if (!h || !p || !s) throw new OidcError("ID token tidak valid.", "invalid_id_token");
  const header = decodeSegment<{ alg?: string; kid?: string }>(h);
  if (header.alg !== "RS256") throw new OidcError("Algoritma ID token tidak diizinkan.", "invalid_id_token");

  let keys = await jwks();
  let jwk = keys.find((k) => k.kid === header.kid && (k.use ?? "sig") === "sig");
  if (!jwk) {
    keys = await jwks(true);
    jwk = keys.find((k) => k.kid === header.kid && (k.use ?? "sig") === "sig");
  }
  if (!jwk) throw new OidcError("Kunci ID token tidak dikenal.", "invalid_id_token");

  const publicKey = createPublicKey({ key: jwk, format: "jwk" });
  const valid = verifySignature("RSA-SHA256", Buffer.from(`${h}.${p}`), publicKey, Buffer.from(s, "base64url"));
  if (!valid) throw new OidcError("Signature ID token tidak valid.", "invalid_id_token");

  const claims = decodeSegment<JwtClaims>(p);
  const now = Math.floor(Date.now() / 1000);
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (claims.iss !== cfg.issuer) throw new OidcError("Issuer ID token tidak valid.", "invalid_id_token");
  if (!aud.includes(cfg.clientId)) throw new OidcError("Audience ID token tidak valid.", "invalid_id_token");
  if (aud.length > 1 && claims.azp !== cfg.clientId) throw new OidcError("azp ID token tidak valid.", "invalid_id_token");
  if (typeof claims.exp !== "number" || claims.exp + 30 < now) throw new OidcError("ID token kedaluwarsa.", "invalid_id_token");
  if (typeof claims.iat !== "number" || claims.iat - 30 > now) throw new OidcError("iat ID token tidak valid.", "invalid_id_token");
  if (!claims.nonce || claims.nonce !== expectedNonce) throw new OidcError("Nonce ID token tidak cocok.", "invalid_id_token");
  if (!claims.sub) throw new OidcError("ID token tanpa subject.", "invalid_id_token");
  return claims;
}

export function claimAtPath(claims: Record<string, unknown>, path: string): unknown {
  let node: unknown = claims;
  for (const part of path.split(".")) {
    if (!node || typeof node !== "object" || !(part in (node as Record<string, unknown>))) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}
