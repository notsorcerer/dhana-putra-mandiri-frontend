"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SvgIcon } from "@/components/app/svg-sprites";
import { cn } from "@/lib/utils";
import { useAuth, type Role } from "@/lib/auth";
import { MENU, menuForRole, type MenuItem } from "@/lib/menu";

function isItemActive(item: MenuItem, pathname: string): boolean {
  if (item.isActive) return item.isActive(pathname);
  if (item.href === "/") return pathname === "/";
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** Label halaman aktif untuk breadcrumb topbar (paritas dengan {{ title }} di base.html). */
function pageTitle(pathname: string): string {
  if (pathname === "/") return "Ringkasan operasional";
  if (pathname.startsWith("/products/abc-analysis")) return "Analisis persediaan";
  if (pathname.startsWith("/products/stock-estimation")) return "Pengisian stok";
  if (pathname.startsWith("/stock-movements")) return "Pergerakan stok";
  if (pathname.startsWith("/products")) return "Stok & Gudang";
  if (pathname.startsWith("/sales-invoices/new")) return "Buat penjualan";
  if (pathname.startsWith("/sales-invoices/")) return "Faktur penjualan";
  if (pathname.startsWith("/sales-invoices")) return "Pesanan";
  if (pathname.startsWith("/goods-receipts/new")) return "Buat penerimaan";
  if (pathname.startsWith("/goods-receipts/")) return "Penerimaan barang";
  if (pathname.startsWith("/goods-receipts")) return "Pembelian";
  if (pathname.startsWith("/deliveries/new")) return "Buat pengiriman";
  if (pathname.startsWith("/deliveries/")) return "Surat jalan";
  if (pathname.startsWith("/deliveries")) return "Pengiriman";
  if (pathname.startsWith("/debit-notes")) return "Retur";
  if (pathname.startsWith("/customers")) return "Pelanggan";
  if (pathname.startsWith("/suppliers")) return "Data Master";
  if (pathname.startsWith("/payments/new")) return "Catat mutasi dana";
  if (pathname.startsWith("/payments")) return "Mutasi kas dan bank";
  if (pathname.startsWith("/general-ledger")) return "Jejak jurnal & buku besar";
  if (pathname.startsWith("/chart-of-accounts")) return "Bagan akun";
  if (pathname.startsWith("/accounting-periods")) return "Rekonsiliasi dan tutup buku";
  if (pathname.startsWith("/reports/balance-sheet")) return "Piutang dan neraca";
  if (pathname.startsWith("/reports/sales-trends")) return "Laporan laba rugi & tren";
  if (pathname.startsWith("/reports/product-sales")) return "Penjualan per produk";
  if (pathname.startsWith("/reports/annual")) return "Perbandingan tahunan";
  if (pathname.startsWith("/reports/pie-charts")) return "Distribusi nilai";
  if (pathname.startsWith("/reports")) return "Laporan";
  if (pathname.startsWith("/hr/employees")) return "Data karyawan";
  if (pathname.startsWith("/hr/mutations")) return "Mutasi karyawan";
  if (pathname.startsWith("/hr/labor-records")) return "Catatan tenaga kerja";
  if (pathname.startsWith("/hr/payroll")) return "Payroll & fee pemasaran";

  for (const section of MENU) {
    for (const item of section.items) {
      if (isItemActive(item, pathname)) return item.label;
    }
  }
  return "Ruang kerja";
}

const PROFILE_META: Record<Role, { name: string; roleLabel: string; initial: string }> = {
  direktur: { name: "Pemilik", roleLabel: "Pemilik", initial: "P" },
  admin: { name: "Admin", roleLabel: "Admin", initial: "A" },
  sales: { name: "Penjualan", roleLabel: "Penjualan", initial: "P" },
  gudang: { name: "Gudang", roleLabel: "Gudang", initial: "G" },
  kasir: { name: "Keuangan", roleLabel: "Keuangan", initial: "K" },
  accounting: { name: "Akuntansi", roleLabel: "Keuangan", initial: "A" },
  stakeholder: { name: "Pemangku", roleLabel: "Pemilik", initial: "P" },
};

function Brand() {
  return (
    <>
      <span className="brandmark" aria-hidden="true">
        dp<span>.</span>
      </span>
      <span className="brandwords">
        <b>Dhana Putra</b>
        <span>Mandiri</span>
      </span>
    </>
  );
}

/** Tanggal topbar, dihitung sekali saat modul dimuat (hindari mismatch SSR). */
const TODAY = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
}).format(new Date());

/** Kerangka aplikasi: aside#sidebar, button.scrim, dan div.shell (paritas dengan templates/base.html). */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("menu", open);
    return () => {
      document.body.classList.remove("menu");
    };
  }, [open]);

  const handleLogout = () => {
    setOpen(false);
    logout();
    router.replace("/login");
  };

  const sections = session ? menuForRole(session.role) : [];
  const profile = session ? PROFILE_META[session.role] : null;

  return (
    <div className={cn("min-h-screen", open && "menu")}>
      <a className="skip" href="#content">
        Langsung ke isi
      </a>

      <aside id="sidebar" className="rail">
        <Link href="/" className="brand rail-brand" onClick={() => setOpen(false)}>
          <Brand />
        </Link>

        <nav aria-label="Navigasi utama">
          {sections.map((section) => (
            <div key={section.title}>
              <small>{section.title}</small>
              {section.items.map((item) => {
                const active = isItemActive(item, pathname);
                return (
                  <Link
                    key={`${section.title}-${item.label}`}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn("nav-link", active && "active")}
                  >
                    <SvgIcon name={item.icon} />
                    <span>{item.label}</span>
                    {item.badge ? <b className="navcount">{item.badge}</b> : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {session && profile ? (
          <div className="profile">
            <span className="avatar" aria-hidden="true">
              {profile.initial}
            </span>
            <div>
              <b>{profile.name}</b>
              <small>{profile.roleLabel}</small>
            </div>
            <button
              type="button"
              className="icon ml-auto"
              title="Keluar"
              aria-label="Keluar"
              onClick={handleLogout}
            >
              <SvgIcon name="exit" />
            </button>
          </div>
        ) : null}
      </aside>

      <button
        type="button"
        className="scrim"
        aria-label="Tutup navigasi"
        hidden={!open}
        onClick={() => setOpen(false)}
      />

      <div className="shell">
        <header className="topbar">
          <button
            type="button"
            className="mobile icon"
            id="toggle"
            aria-controls="sidebar"
            aria-expanded={open}
            aria-label="Buka navigasi"
            onClick={() => setOpen((prev) => !prev)}
          >
            <SvgIcon name="menu" />
          </button>

          <span className="location">
            <SvgIcon name="warehouse" />
            Gudang utama <em>/</em> <strong>{pageTitle(pathname)}</strong>
          </span>

          <div className="header-end">
            <span className="system">
              <i aria-hidden="true" />
              Demo sintetis
            </span>
            <span className="header-date">
              <SvgIcon name="calendar" />
              {TODAY}
            </span>
          </div>
        </header>

        <main id="content" className="app-main">
          {children}
        </main>
      </div>
    </div>
  );
}
