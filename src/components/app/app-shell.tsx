"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Droplet, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { menuForRole } from "@/lib/menu";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { session } = useAuth();
  if (!session) return null;
  const sections = menuForRole(session.role);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    // Rute "nested" (mis. /reports/balance-sheet) tetap menyorot induknya.
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="flex flex-col gap-5">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="mb-1.5 px-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            {section.title}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function BrandHeader() {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Droplet className="size-5" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold">CV Dhana Putra Mandiri</p>
        <p className="text-[11px] text-muted-foreground">Distribusi Minyak Goreng</p>
      </div>
    </div>
  );
}

/** Kerangka aplikasi: sidebar desktop, drawer mobile, dan bilah atas. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { session, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-6 border-r bg-card px-4 py-5 lg:flex">
        <BrandHeader />
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
      </aside>

      {/* Area konten */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur">
          {/* Menu mobile */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Buka menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-4">
              <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
              <div className="mb-5">
                <BrandHeader />
              </div>
              <div className="overflow-y-auto">
                <NavLinks onNavigate={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="hidden text-sm text-muted-foreground sm:block">
            Sistem Informasi Distribusi Minyak Goreng
          </div>

          <div className="flex items-center gap-2.5">
            {session ? (
              <span className="hidden text-sm text-muted-foreground sm:block">
                Masuk sebagai <span className="font-medium text-foreground">{session.label}</span>
              </span>
            ) : null}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut />
              Keluar
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8">{children}</main>

        <footer className="border-t px-4 py-3 text-center text-xs text-muted-foreground">
          CV Dhana Putra Mandiri — Frontend (Next.js) · Backend: Django REST Framework
        </footer>
      </div>
    </div>
  );
}
