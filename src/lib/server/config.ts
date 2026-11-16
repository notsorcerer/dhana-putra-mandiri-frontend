/**
 * Konfigurasi server-side OAuth 2.0 / OIDC (Backend-for-Frontend).
 * HANYA diimpor oleh Route Handler & proxy.ts — tidak pernah dikirim ke browser.
 * Nilai diambil dari environment (lihat .env.example), tanpa default produksi.
 */

export interface AuthConfig {
  issuer: string;
  clientId: string;
  clientSecret: string | null;
  scopes: string;
  apiAudience: string;
  roleClaimPaths: string[];
  appBaseUrl: string;
  apiBaseUrl: string;
  sessionSecret: string;
  cookieSecure: boolean;
  postLogoutRedirectPath: string;
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Environment variable ${name} wajib diisi (lihat frontend/.env.example).`);
  }
  return value;
}

let cached: AuthConfig | null = null;

export function authConfig(): AuthConfig {
  if (cached) return cached;
  const appBaseUrl = required("APP_BASE_URL").replace(/\/+$/, "");
  const issuer = required("OIDC_ISSUER").replace(/\/+$/, "");
  const sessionSecret = required("SESSION_SECRET");
  if (sessionSecret.length < 32) {
    throw new Error("SESSION_SECRET minimal 32 karakter acak.");
  }
  const isProd = process.env.NODE_ENV === "production";
  const secureDefault = appBaseUrl.startsWith("https://");
  const cookieSecure = process.env.SESSION_COOKIE_SECURE
    ? process.env.SESSION_COOKIE_SECURE === "true"
    : secureDefault;
  if (isProd && (!cookieSecure || !issuer.startsWith("https://") || !appBaseUrl.startsWith("https://"))) {
    throw new Error("Production wajib HTTPS untuk APP_BASE_URL, OIDC_ISSUER, dan cookie Secure.");
  }
  const apiAudience = process.env.OIDC_API_AUDIENCE?.trim() || "dhana-putra-api";
  cached = {
    issuer,
    clientId: required("OIDC_CLIENT_ID"),
    clientSecret: process.env.OIDC_CLIENT_SECRET?.trim() || null,
    scopes: process.env.OIDC_SCOPES?.trim() || "openid profile email",
    apiAudience,
    roleClaimPaths: (process.env.OIDC_ROLE_CLAIM_PATHS?.trim() || `resource_access.${apiAudience}.roles`)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    appBaseUrl,
    apiBaseUrl: required("API_BASE_URL").replace(/\/+$/, ""),
    sessionSecret,
    cookieSecure,
    postLogoutRedirectPath: "/login?logged_out=1",
  };
  return cached;
}

export function redirectUri(): string {
  return `${authConfig().appBaseUrl}/api/auth/callback`;
}
