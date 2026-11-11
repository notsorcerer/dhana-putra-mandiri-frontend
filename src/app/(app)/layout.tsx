import { AuthGuard } from "@/components/app/auth-guard";
import { AppShell } from "@/components/app/app-shell";

/**
 * Layout route group aplikasi (terproteksi).
 * Semua halaman di dalam (app) memerlukan sesi peran demo.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
