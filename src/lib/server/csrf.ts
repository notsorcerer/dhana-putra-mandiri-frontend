import type { NextRequest } from "next/server";
import { authConfig } from "./config";

export const CSRF_HEADER = "x-dpm-csrf";

/**
 * Proteksi CSRF untuk request yang mengubah state:
 * 1. Cookie sesi SameSite=Lax (tidak terkirim pada POST lintas situs),
 * 2. header Origin wajib sama dengan APP_BASE_URL,
 * 3. header kustom `x-dpm-csrf: 1` wajib ada (memaksa preflight CORS
 *    yang tidak pernah diizinkan untuk origin asing).
 */
export function isSameOriginRequest(request: NextRequest, requireHeader = true): boolean {
  const expected = new URL(authConfig().appBaseUrl).origin;
  const origin = request.headers.get("origin");
  if (origin !== expected) return false;
  if (requireHeader && request.headers.get(CSRF_HEADER) !== "1") return false;
  return true;
}
