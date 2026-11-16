/**
 * Klien REST API untuk backend CV Dhana Putra Mandiri (Django + DRF).
 *
 * - Semua request lewat BFF same-origin `/api/backend/*` (Route Handler Next.js)
 *   yang menyisipkan access token OAuth 2.0 dari cookie HttpOnly di sisi server.
 *   Browser tidak pernah memegang token (tanpa localStorage).
 * - Request yang mengubah data membawa header CSRF `x-dpm-csrf: 1`.
 * - Respons desimal dikembalikan backend sebagai string; gunakan helper num()
 *   dari lib/format untuk mengonversinya di UI.
 * - Respons 401 (sesi berakhir) mengarahkan ke halaman login dengan returnTo.
 */

const API_BASE = "/api/backend";
export const CSRF_HEADER_NAME = "x-dpm-csrf";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export type QueryParams = Record<string, string | number | undefined | null>;

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  params?: QueryParams;
}

function buildUrl(path: string, params?: QueryParams): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost";
  const url = new URL(`${API_BASE}${path.startsWith("/") ? path : `/${path}`}`, origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

function extractApiMessage(data: unknown, status: number): string {
  if (typeof data === "string") {
    if (data.trimStart().startsWith("<!DOCTYPE") || data.includes("<html")) {
      return `Kesalahan internal pada server backend (HTTP ${status}).`;
    }
    return data.slice(0, 300);
  }
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (typeof obj.detail === "string") return obj.detail;
    if (typeof obj.error === "string") return obj.error;
    // Format standar baru backend: { code, message, details }
    if (typeof obj.message === "string") {
      const genericMsg = "Permintaan tidak valid atau terjadi kesalahan operasional.";
      if (obj.message !== genericMsg || !obj.details) {
        return obj.message;
      }
      const detailsMsg = extractApiMessage(obj.details, status);
      return detailsMsg || obj.message;
    }
    if (typeof obj.detail === "object") {
      return `Permintaan ditolak: ${JSON.stringify(obj.detail)}`;
    }
    const parts: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        parts.push(`${key}: ${value.map(String).join(", ")}`);
      } else if (typeof value === "string") {
        parts.push(`${key}: ${value}`);
      } else if (value && typeof value === "object") {
        parts.push(`${key}: ${JSON.stringify(value)}`);
      }
    }
    if (parts.length > 0) return parts.join("; ");
  }
  return `Terjadi kesalahan pada server (HTTP ${status}).`;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, params } = options;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (method !== "GET") {
    headers[CSRF_HEADER_NAME] = "1";
  }
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError(
      "Tidak dapat terhubung ke server aplikasi. Periksa koneksi Anda.",
      0,
      null,
    );
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      if (!window.location.pathname.startsWith("/login")) {
        // Sesi OAuth berakhir/dicabut: redirect penuh ke login (di luar siklus React).
        const returnTo = `${window.location.pathname}${window.location.search}`;
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}&error=session_expired`;
      }
    }
    throw new ApiError(extractApiMessage(data, response.status), response.status, data);
  }

  return data as T;
}

export function apiGet<T>(path: string, params?: QueryParams): Promise<T> {
  return api<T>(path, { method: "GET", params });
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return api<T>(path, { method: "POST", body: body ?? {} });
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return api<T>(path, { method: "PATCH", body: body ?? {} });
}

export function apiDelete<T>(path: string): Promise<T> {
  return api<T>(path, { method: "DELETE" });
}

/**
 * Mengambil seluruh baris dari endpoint terpaginasi (mengikuti ?page=
 * sampai habis, maksimal maxPages halaman). Untuk daftar master kecil
 * (produk, pelanggan, COA, dsb.) yang dipakai sebagai opsi dropdown.
 */
export async function fetchAllPages<T>(path: string, maxPages = 20): Promise<T[]> {
  const all: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const separator = path.includes("?") ? "&" : "?";
    const data = await apiGet<{ count: number; next: string | null; results: T[] }>(`${path}${separator}page=${page}`);
    all.push(...data.results);
    if (!data.next) break;
  }
  return all;
}
