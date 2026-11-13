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
  /** Keterangan singkat di kanan baris radio login. */
  hint: string;
}

export const ROLES: RoleInfo[] = [
  {
    value: "direktur",
    token: "demo-direktur",
    label: "Direktur",
    description: "Akses penuh: seluruh modul, laporan, konfirmasi dokumen, dan manajemen periode akuntansi.",
    hint: "Ringkasan usaha",
  },
  {
    value: "admin",
    token: "demo-admin",
    label: "Admin (Sales & Finance)",
    description: "Faktur penjualan, pembayaran kas/bank, dan pemantauan data operasional.",
    hint: "Pengaturan akun",
  },
  {
    value: "sales",
    token: "demo-sales",
    label: "Sales",
    description: "Faktur penjualan dan data produk (nilai HPP disembunyikan oleh backend).",
    hint: "Pesanan",
  },
  {
    value: "gudang",
    token: "demo-gudang",
    label: "Gudang",
    description: "Penerimaan barang, surat jalan, konfirmasi stok. Kolom harga disembunyikan oleh backend.",
    hint: "Persediaan",
  },
  {
    value: "kasir",
    token: "demo-kasir",
    label: "Kasir (Finance)",
    description: "Pembayaran masuk/keluar (BKM/BKK), piutang pelanggan, dan hutang supplier.",
    hint: "Kas & bank",
  },
  {
    value: "accounting",
    token: "demo-accounting",
    label: "Accounting",
    description: "Buku besar jurnal, debit note, COA, periode akuntansi, payroll, dan data HR.",
    hint: "Pembukuan",
  },
  {
    value: "stakeholder",
    token: "demo-stakeholder",
    label: "Stakeholder",
    description: "Hanya-baca: ringkasan kinerja, laporan keuangan, dan data operasional.",
    hint: "Laporan",
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
