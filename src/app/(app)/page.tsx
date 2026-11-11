"use client";

import Link from "next/link";
import { AlertTriangle, Banknote, Boxes, Landmark, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { DistributionPieChart, SalesTrendChart } from "@/components/app/charts";
import { KpiCard } from "@/components/app/kpi-card";
import { useAuth } from "@/lib/auth";
import { CAN, can } from "@/lib/menu";
import { num, qty, rupiah } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import type { BalanceSheet, PieChartsReport, StockEstimationRow, SalesTrendsReport } from "@/types/api";

export default function DashboardPage() {
  const { session } = useAuth();
  const role = session?.role;
  const showFinancial = can(CAN.viewFinancialValues, role);

  const balance = useApi<BalanceSheet>(showFinancial ? "/finance/reports/balance-sheet/" : null);
  const trends = useApi<SalesTrendsReport>(role === "gudang" ? null : "/finance/reports/sales-trends/");
  const pie = useApi<PieChartsReport>(showFinancial ? "/finance/reports/pie-charts/" : null);
  const stock = useApi<StockEstimationRow[]>(role === null ? null : "/inventory/products/stock-estimation/");

  const lowStock = (stock.data ?? [])
    .filter((row) => row.is_stock_below_28_days)
    .sort((a, b) => a.estimated_stock_days - b.estimated_stock_days)
    .slice(0, 8);

  const bs = balance.data;
  const kasBank = bs ? num(bs.assets.kas_dan_bank.subtotal) : 0;
  const labaBerjalan = bs ? num(bs.equity.laba_periode_berjalan) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Ringkasan performa distribusi minyak goreng — peran: ${session?.label ?? "-"}.`}
      />

      {showFinancial ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Kas & Bank"
            value={balance.loading && !bs ? "Memuat…" : rupiah(kasBank)}
            hint="Saldo akun kas tunai dan bank"
            icon={<Wallet className="size-5" />}
          />
          <KpiCard
            title="Total Aktiva"
            value={bs ? rupiah(bs.assets.total_assets) : "Memuat…"}
            hint={bs ? `Persediaan ${rupiah(bs.assets.persediaan_barang_dagang)}` : undefined}
            icon={<Banknote className="size-5" />}
          />
          <KpiCard
            title="Total Kewajiban"
            value={bs ? rupiah(bs.liabilities.total_liabilities) : "Memuat…"}
            hint={bs ? `Hutang usaha ${rupiah(bs.liabilities.hutang_usaha_supplier)}` : undefined}
            icon={<Landmark className="size-5" />}
          />
          <KpiCard
            title="Laba Periode Berjalan"
            value={bs ? rupiah(labaBerjalan) : "Memuat…"}
            tone={labaBerjalan >= 0 ? "positive" : "negative"}
            hint="Laba kotor dikurangi beban operasional"
            icon={<TrendingUp className="size-5" />}
          />
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-5">
        {trends.data ? (
          <div className="lg:col-span-3">
            <SalesTrendChart trends={trends.data.trends} />
          </div>
        ) : null}

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-amber-500" />
                Stok di Bawah 28 Hari
              </CardTitle>
              <CardDescription>
                Produk dengan estimasi stok &lt; 28 hari berdasarkan konsumsi harian.{" "}
                <Link href="/products/stock-estimation" className="text-primary underline-offset-4 hover:underline">
                  Lihat semua
                </Link>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stock.loading && stock.data === null ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Memuat…</p>
              ) : stock.error ? (
                <p className="py-8 text-center text-sm text-destructive">{stock.error}</p>
              ) : lowStock.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Tidak ada produk dengan stok di bawah 28 hari.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead className="text-right">Stok</TableHead>
                      <TableHead className="text-right">Estimasi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStock.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <p className="font-medium">{row.name}</p>
                          <p className="text-xs text-muted-foreground">{row.sku}</p>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {qty(row.current_stock)} {row.uom}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums ${
                              row.estimated_stock_days <= 14
                                ? "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                                : "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
                            }`}
                          >
                            {qty(row.estimated_stock_days)} hari
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {pie.data ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <DistributionPieChart
            title="Distribusi Nilai Stok per Merek"
            description={`Total nilai persediaan: ${rupiah(pie.data.total_portfolio_value)}`}
            data={pie.data.brand_distribution}
          />
          <DistributionPieChart
            title="Distribusi Nilai Stok per Kemasan"
            description="Proporsi nilai persediaan berdasarkan ukuran kemasan"
            data={pie.data.package_size_distribution}
          />
        </div>
      ) : null}

      {stock.data && stock.data.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Boxes className="size-5 text-primary" />
              Estimasi Seluruh Produk
            </CardHeader>
            <CardDescription>Ringkasan stok, konsumsi harian, dan kelas ABC</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead className="text-right">Stok</TableHead>
                  <TableHead className="text-right">Konsumsi/hari</TableHead>
                  <TableHead className="text-right">Estimasi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...stock.data]
                  .sort((a, b) => a.estimated_stock_days - b.estimated_stock_days)
                  .map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <p className="font-medium">{row.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.brand} · {row.package_size}
                        </p>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={row.abc_class} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {qty(row.current_stock)} {row.uom}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{qty(row.daily_consumption_rate)}</TableCell>
                      <TableCell className="text-right tabular-nums">{qty(row.estimated_stock_days)} hari</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
