"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

/** Melindungi seluruh route group (app): wajib memiliki sesi OAuth dengan peran aplikasi. */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, status, refresh } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      const returnTo = `${pathname}${window.location.search}`;
      router.replace(returnTo === "/" ? "/login" : `/login?returnTo=${encodeURIComponent(returnTo)}`);
    } else if (status === "no_role") {
      router.replace("/login?error=no_role");
    }
  }, [status, router, pathname]);

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-muted-foreground">
        <p className="text-sm">Server identitas tidak dapat dihubungi.</p>
        <button type="button" className="text-sm underline" onClick={() => void refresh()}>
          Coba lagi
        </button>
      </div>
    );
  }

  if (status !== "authenticated" || !session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
        <p className="text-sm">Memuat sesi…</p>
      </div>
    );
  }

  return <>{children}</>;
}
