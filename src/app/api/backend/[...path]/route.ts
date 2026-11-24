import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/lib/server/config";
import { isSameOriginRequest } from "@/lib/server/csrf";
import { clearSession, getActiveSession, writeSession, type StoredSession } from "@/lib/server/session";

/**
 * Proxy BFF: /api/backend/<path> -> {API_BASE_URL}/<path>/
 * Menyisipkan `Authorization: Bearer <access_token>` dari cookie sesi
 * di sisi server, sehingga token tidak pernah terekspos ke JavaScript.
 */

const FORWARD_REQUEST_HEADERS = ["accept", "content-type", "accept-language"];
const FORWARD_RESPONSE_HEADERS = ["content-type", "content-disposition", "retry-after"];
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const MAX_BODY_BYTES = 5 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 30_000;
// Ringkasan AI (SLM) bisa lebih lama dari request biasa; backend membatasi 120 dtk.
const SLOW_PATH_TIMEOUT_MS = 150_000;
const SLOW_PATHS = new Set(["finance/reports/summary"]);

function buildTarget(segments: string[], search: string): string | null {
  if (segments.some((s) => s === "" || s === "." || s === ".." || s.includes("/") || s.includes("\\"))) {
    return null;
  }
  const path = segments.map(encodeURIComponent).join("/");
  // Seluruh route DRF diakhiri slash; Next.js membuang trailing slash pada URL.
  return `${authConfig().apiBaseUrl}/${path}/${search}`;
}

async function forward(
  request: NextRequest,
  target: string,
  session: StoredSession,
  body: ArrayBuffer | undefined,
  timeoutMs: number,
) {
  const headers = new Headers();
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("authorization", `Bearer ${session.accessToken}`);
  return fetch(target, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
    redirect: "manual",
    signal: AbortSignal.timeout(timeoutMs),
  });
}

async function handler(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  if (!SAFE_METHODS.has(request.method) && !isSameOriginRequest(request)) {
    return NextResponse.json({ detail: "Permintaan ditolak: validasi CSRF gagal." }, { status: 403 });
  }

  const { path } = await ctx.params;
  const target = buildTarget(path, request.nextUrl.search);
  if (!target) return NextResponse.json({ detail: "Path tidak valid." }, { status: 400 });
  const timeoutMs = SLOW_PATHS.has(path.join("/")) ? SLOW_PATH_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;

  let result = await getActiveSession(request.cookies);
  if (result.status === "unavailable") {
    return NextResponse.json({ detail: "Identity provider tidak dapat dihubungi." }, { status: 503 });
  }
  if (result.status !== "valid") {
    const res = NextResponse.json({ detail: "Sesi berakhir. Silakan login kembali." }, { status: 401 });
    clearSession(res, request.cookies);
    return res;
  }

  let body: ArrayBuffer | undefined;
  if (!SAFE_METHODS.has(request.method)) {
    body = await request.arrayBuffer();
    if (body.byteLength > MAX_BODY_BYTES) {
      return NextResponse.json({ detail: "Payload terlalu besar." }, { status: 413 });
    }
  }

  let upstream: Response;
  try {
    upstream = await forward(request, target, result.session, body, timeoutMs);
    // Access token ditolak (mis. dicabut/kedaluwarsa lebih cepat): coba refresh sekali.
    if (upstream.status === 401 && result.session.refreshToken) {
      const retry = await getActiveSession(request.cookies, true);
      if (retry.status === "valid") {
        result = retry;
        upstream = await forward(request, target, retry.session, body, timeoutMs);
      }
    }
  } catch (error) {
    console.error("[bff] backend tidak dapat dihubungi:", error instanceof Error ? error.message : error);
    return NextResponse.json({ detail: "Tidak dapat terhubung ke server backend." }, { status: 502 });
  }

  const resHeaders = new Headers({ "Cache-Control": "no-store" });
  for (const name of FORWARD_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) resHeaders.set(name, value);
  }
  const res = new NextResponse(upstream.status === 204 ? null : upstream.body, {
    status: upstream.status,
    headers: resHeaders,
  });
  if (upstream.status === 401) {
    clearSession(res, request.cookies);
  } else if (result.status === "valid" && result.refreshed) {
    writeSession(res, request.cookies, result.session);
  }
  return res;
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
