"use client";

/**
 * Manajemen sesi login demo berbasis peran.
 * Backend menyediakan token Bearer statis per peran saat DEMO_MODE aktif,
 * sehingga login cukup memilih peran tanpa memasukkan kredensial.
 */

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Role = "direktur" | "admin" | "sales" | "gudang" | "kasir" | "accounting" | "stakeholder";

export interface RoleInfo {
  value: Role;
  token: string;
  label: string;
  description: string;
  /** Kelas ikon warna kartu peran di halaman login. */
  tone: string;
}

export const ROLES: RoleInfo[] = [
  {
    value: "direktur",
    token: "demo-direktur",
    label: "Direktur",
    description: "Akses penuh: seluruh modul, laporan, konfirmasi dokumen, dan manajemen periode akuntansi.",
    tone: "border-amber-200 bg-amber-50 text-amber-900 hover:border-amber-400 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
  },
  {
    value: "admin",
    token: "demo-admin",
    label: "Admin (Sales & Finance)",
    description: "Faktur penjualan, pembayaran kas/bank, dan pemantauan data operasional.",
    tone: "border-blue-200 bg-blue-50 text-blue-900 hover:border-blue-400 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100",
  },
  {
    value: "sales",
    token: "demo-sales",
    label: "Sales",
    description: "Faktur penjualan dan data produk (nilai HPP disembunyikan oleh backend).",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-emerald-400 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  },
  {
    value: "gudang",
    token: "demo-gudang",
    label: "Gudang",
    description: "Penerimaan barang, surat jalan, konfirmasi stok. Kolom harga disembunyikan oleh backend.",
    tone: "border-orange-200 bg-orange-50 text-orange-900 hover:border-orange-400 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-100",
  },
  {
    value: "kasir",
    token: "demo-kasir",
    label: "Kasir (Finance)",
    description: "Pembayaran masuk/keluar (BKM/BKK), piutang pelanggan, dan hutang supplier.",
    tone: "border-violet-200 bg-violet-50 text-violet-900 hover:border-violet-400 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-100",
  },
  {
    value: "accounting",
    token: "demo-accounting",
    label: "Accounting",
    description: "Buku besar jurnal, debit note, COA, periode akuntansi, payroll, dan data HR.",
    tone: "border-cyan-200 bg-cyan-50 text-cyan-900 hover:border-cyan-400 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-100",
  },
  {
    value: "stakeholder",
    token: "demo-stakeholder",
    label: "Stakeholder",
    description: "Hanya-baca: ringkasan kinerja, laporan keuangan, dan data operasional.",
    tone: "border-slate-300 bg-slate-50 text-slate-900 hover:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
  },
];

export function roleInfo(role: Role): RoleInfo {
  const found = ROLES.find((r) => r.value === role);
  if (!found) throw new Error(`Peran tidak dikenal: ${role}`);
  return found;
}

const STORAGE_KEY = "dpm_auth";

export interface AuthSession {
  role: Role;
  token: string;
  label: string;
}

interface AuthContextValue {
  session: AuthSession | null;
  hydrated: boolean;
  login: (role: RoleInfo) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AuthSession;
        if (parsed && parsed.token && parsed.role) {
          // Restorasi sesi dari localStorage setelah mount (hindari mismatch SSR).
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setSession(parsed);
        }
      }
    } catch {
      // abaikan data sesi yang rusak
    }
    setHydrated(true);
  }, []);

  const login = useCallback((role: RoleInfo) => {
    const next: AuthSession = { role: role.value, token: role.token, label: role.label };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  return <AuthContext.Provider value={{ session, hydrated, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth hanya boleh dipakai di dalam <AuthProvider>");
  }
  return ctx;
}
