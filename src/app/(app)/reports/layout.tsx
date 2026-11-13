"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PeriodFilter } from "@/components/app/period-filter";
import { useAuth } from "@/lib/auth";
import { CAN, can, type Role } from "@/lib/menu";

/** Navigasi tab laporan keuangan & analitik (gaya `.tabs` prototipe). */
const REPORT_TABS: { href: string; label: string; roles: readonly Role[] }[] = [
  { href: "/reports/sales-trends", label: "Tren & laba kotor", roles: CAN.viewSalesReports },
  { href: "/reports/balance-sheet", label: "Piutang & neraca", roles: CAN.viewFinanceReports },
  { href: "/reports/product-sales", label: "Per produk", roles: CAN.viewSalesReports },
  { href: "/reports/annual", label: "Perbandingan tahunan", roles: CAN.viewFinanceReports },
  { href: "/reports/pie-charts", label: "Distribusi stok", roles: CAN.viewFinanceReports },
];

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { session } = useAuth();
  const visibleTabs = REPORT_TABS.filter((tab) => can(tab.roles, session?.role));

  return (
    <div>
      <header className="pagehead">
        <div>
          <p className="eyebrow">LAPORAN MANAJEMEN</p>
          <h1>Laporan keuangan & penjualan</h1>
          <p>Tren omzet, neraca, kontribusi produk, perbandingan tahunan, dan distribusi persediaan.</p>
        </div>
        <div className="tools">
          <PeriodFilter />
          <Button type="button" variant="outline" onClick={() => window.print()}>
            Cetak / Ekspor
          </Button>
        </div>
      </header>
      <nav className="tabs" aria-label="Tampilan halaman">
        {visibleTabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={pathname === tab.href ? "page" : undefined}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
