"use client";

/**
 * Manajemen sesi login OAuth 2.0 / OpenID Connect (Keycloak).
 *
 * - Login: Authorization Code Flow + PKCE ditangani server (/api/auth/login).
 * - Token disimpan server-side dalam cookie HttpOnly terenkripsi; JavaScript
 *   browser TIDAK pernah memegang access/refresh token (tidak ada localStorage).
 * - Pemulihan sesi: GET /api/auth/session saat mount, saat tab kembali aktif,
 *   dan berkala sebelum access token kedaluwarsa (refresh otomatis di server).
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CSRF_HEADER_NAME } from "./api";

export type Role = "direktur" | "admin" | "gudang" | "stakeholder";

export interface RoleInfo {
  value: Role;
  label: string;
  description: string;
  /** Keterangan singkat (dipakai di halaman login). */
  hint: string;
}

export const ROLES: RoleInfo[] = [
  {
    value: "direktur",
    label: "Direktur",
    description: "Akses penuh: seluruh modul, laporan, konfirmasi dokumen, dan manajemen periode akuntansi.",
    hint: "Ringkasan usaha",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Faktur penjualan, pembayaran kas/bank, dan pemantauan data operasional.",
    hint: "Pengaturan akun",
  },
  {
    value: "gudang",
    label: "Gudang",
    description: "Penerimaan barang, surat jalan, konfirmasi stok. Kolom harga disembunyikan oleh backend.",
    hint: "Persediaan",
  },
  {
    value: "stakeholder",
    label: "Stakeholder",
    description: "Hanya-baca: ringkasan kinerja, laporan keuangan, dan data operasional.",
    hint: "Laporan",
  },
];

const ROLE_PRIORITY: Role[] = ["direktur", "admin", "gudang", "stakeholder"];

export function roleInfo(role: Role): RoleInfo {
  const found = ROLES.find((r) => r.value === role);
  if (!found) throw new Error(`Peran tidak dikenal: ${role}`);
  return found;
}

export interface AuthSession {
  /** Peran utama untuk menu/UI (prioritas direktur > admin > gudang > stakeholder). */
  role: Role;
  roles: Role[];
  label: string;
  username: string;
  name: string;
  email: string | null;
  accessExpiresAt: number;
}

export type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "no_role" | "error";

interface AuthContextValue {
  session: AuthSession | null;
  status: AuthStatus;
  hydrated: boolean;
  login: (returnTo?: string) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

interface SessionPayload {
  authenticated: boolean;
  reason?: string;
  user?: { username: string; name: string; email: string | null; roles: Role[] };
  accessExpiresAt?: number;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toSession(payload: SessionPayload): AuthSession | null {
  if (!payload.authenticated || !payload.user) return null;
  const roles = payload.user.roles.filter((r): r is Role => ROLE_PRIORITY.includes(r));
  const role = ROLE_PRIORITY.find((r) => roles.includes(r));
  if (!role) return null;
  return {
    role,
    roles,
    label: roleInfo(role).label,
    username: payload.user.username,
    name: payload.user.name,
    email: payload.user.email,
    accessExpiresAt: payload.accessExpiresAt ?? 0,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store", credentials: "same-origin" });
      const payload = (await res.json().catch(() => ({ authenticated: false }))) as SessionPayload;
      if (res.status === 403) {
        setSession(null);
        setStatus("no_role");
        return;
      }
      if (res.status === 503) {
        setStatus("error");
        return;
      }
      const next = res.ok ? toSession(payload) : null;
      setSession(next);
      setStatus(next ? "authenticated" : "unauthenticated");
    } catch {
      setStatus("error");
    }
  }, []);

  // Pemulihan sesi saat mount & saat tab kembali aktif.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  // Refresh proaktif ~60 detik sebelum access token kedaluwarsa.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!session?.accessExpiresAt) return;
    const delay = Math.max(session.accessExpiresAt * 1000 - Date.now() - 60_000, 15_000);
    timer.current = setTimeout(() => void refresh(), delay);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [session?.accessExpiresAt, refresh]);

  const login = useCallback((returnTo?: string) => {
    const target = returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";
    // Navigasi penuh wajib: Route Handler me-redirect ke authorization endpoint IdP.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`/api/auth/login?returnTo=${encodeURIComponent(target)}`);
  }, []);

  const logout = useCallback(async () => {
    let redirectTo = "/login?logged_out=1";
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: { [CSRF_HEADER_NAME]: "1" },
      });
      const data = (await res.json().catch(() => ({}))) as { redirectTo?: string };
      if (res.ok && data.redirectTo) redirectTo = data.redirectTo;
    } catch {
      // tetap arahkan ke login
    }
    setSession(null);
    setStatus("unauthenticated");
    window.location.assign(redirectTo);
  }, []);

  return (
    <AuthContext.Provider value={{ session, status, hydrated: status !== "loading", login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth hanya boleh dipakai di dalam <AuthProvider>");
  }
  return ctx;
}
