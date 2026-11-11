"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Droplet, Loader2, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { apiGet } from "@/lib/api";
import { ROLES, useAuth, type RoleInfo } from "@/lib/auth";
import type { HealthStatus } from "@/types/api";

export default function LoginPage() {
  const { session, hydrated, login } = useAuth();
  const router = useRouter();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && session) {
      router.replace("/");
    }
  }, [hydrated, session, router]);

  useEffect(() => {
    apiGet<HealthStatus>("/health/")
      .then(setHealth)
      .catch((err: unknown) => {
        setHealthError(err instanceof Error ? err.message : "Backend tidak dapat dihubungi.");
      });
  }, []);

  const handleLogin = (role: RoleInfo) => {
    setPending(role.value);
    login(role);
    router.replace("/");
  };

  const backendOnline = health !== null && health.database === "healthy";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-muted/40 px-4 py-10">
      <div className="space-y-3 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Droplet className="size-8" />
        </div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">CV Dhana Putra Mandiri</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Sistem Informasi Distribusi Minyak Goreng — Inventori, Keuangan, SDM, dan Laporan Manajemen
        </p>
      </div>

      <div className="w-full max-w-3xl space-y-4">
        <div
          className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm ${
            backendOnline
              ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
              : healthError
                ? "border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
                : "border-border bg-card text-muted-foreground"
          }`}
        >
          {healthError ? (
            <AlertTriangle className="size-4 shrink-0" />
          ) : backendOnline ? (
            <CheckCircle2 className="size-4 shrink-0" />
          ) : (
            <Loader2 className="size-4 shrink-0 animate-spin" />
          )}
          {healthError ? (
            <span>
              Backend tidak dapat dihubungi — <span className="font-medium">{healthError}</span>. Jalankan server
              Django (default: http://localhost:8000).
            </span>
          ) : backendOnline ? (
            <span>
              Backend <span className="font-medium">{health?.service}</span> online — database sehat.
            </span>
          ) : (
            <span>Memeriksa koneksi ke backend…</span>
          )}
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="size-4 text-primary" />
            Pilih peran demo untuk masuk
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            Mode demo backend menyediakan token Bearer statis per peran — tanpa perlu kredensial. Hak akses
            sebenarnya tetap divalidasi backend untuk setiap request API.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ROLES.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => handleLogin(role)}
                disabled={pending !== null}
                className={`rounded-lg border p-3.5 text-left transition-colors disabled:opacity-60 ${role.tone}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{role.label}</span>
                  {pending === role.value ? <Loader2 className="size-4 animate-spin" /> : null}
                </div>
                <p className="mt-1 text-xs leading-relaxed opacity-80">{role.description}</p>
              </button>
            ))}
          </div>
        </div>

        <Card className="border-dashed bg-transparent">
          <CardContent className="text-center text-xs text-muted-foreground">
            Frontend: Next.js + TypeScript + Tailwind CSS + shadcn/ui · Backend: Django REST Framework ·
            Demo role picker hanya tersedia saat backend berjalan dengan <code>DEMO_MODE=True</code>.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
