"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, ChartPie, LineChart, Scale, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const REPORTS = [
  {
    href: "/reports/balance-sheet",
    icon: Scale,
    title: "Neraca (Balance Sheet)",
    description: "Posisi keuangan: aktiva, kewajiban, dan ekuitas per tanggal tertentu.",
  },
  {
    href: "/reports/sales-trends",
    icon: LineChart,
    title: "Tren Penjualan 12 Bulan",
    description: "Pendapatan, volume, dan laba kotor bulanan untuk satu tahun terpilih.",
  },
  {
    href: "/reports/product-sales",
    icon: BarChart3,
    title: "Penjualan & Margin Produk",
    description: "Kinerja per SKU: kuantitas, pendapatan, HPP, dan margin per tahun.",
  },
  {
    href: "/reports/annual",
    icon: TrendingUp,
    title: "Ringkasan Keuangan Tahunan",
    description: "Laba kotor, beban operasional, dan laba bersih dengan rincian bulanan.",
  },
  {
    href: "/reports/pie-charts",
    icon: ChartPie,
    title: "Distribusi Persediaan",
    description: "Proporsi nilai stok berdasarkan merek dan ukuran kemasan.",
  },
];

export default function ReportsIndexPage() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {REPORTS.map((report) => {
        const Icon = report.icon;
        return (
          <Link key={report.href} href={report.href} className="group">
            <Card className="h-full transition-colors group-hover:border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="size-5 text-primary" />
                  {report.title}
                </CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Buka laporan <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
