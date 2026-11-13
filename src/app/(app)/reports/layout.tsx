import Link from "next/link";
import { BarChart3, ChartPie, LineChart, Scale, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

/** Navigasi tab laporan keuangan & analitik. */
const REPORT_TABS = [
  { href: "/reports/balance-sheet", label: "Neraca", icon: Scale },
  { href: "/reports/sales-trends", label: "Tren Penjualan", icon: LineChart },
  { href: "/reports/product-sales", label: "Penjualan Produk", icon: BarChart3 },
  { href: "/reports/annual", label: "Ringkasan Tahunan", icon: TrendingUp },
  { href: "/reports/pie-charts", label: "Distribusi Persediaan", icon: ChartPie },
];

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Laporan</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Laporan keuangan dan analitik manajemen CV Dhana Putra Mandiri.
        </p>
      </div>
      <nav className="flex flex-wrap items-center gap-1 rounded-lg border bg-card p-1">
        {REPORT_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
