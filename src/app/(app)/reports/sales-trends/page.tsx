"use client";

import { useState } from "react";
import { LineChart as LineChartIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SalesTrendChart } from "@/components/app/charts";
import { KpiCard } from "@/components/app/kpi-card";
import { availableYears, num, pct, qty, rupiah } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import type { SalesTrendsReport } from "@/types/api";

export default function SalesTrendsPage() {
  const years = availableYears();
  const [year, setYear] = useState<string>(String(years[years.length - 1]));
  const { data, loading, error } = useApi<SalesTrendsReport>(`/finance/reports/sales-trends/?year=${year}`);

  const trends = data?.trends ?? [];
  const totalSales = trends.reduce((s, t) => s + num(t.total_sales), 0);
  const totalProfit = trends.reduce((s, t) => s + num(t.gross_profit), 0);
  const activeMonths = trends.filter((t) => num(t.total_sales) > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <LineChartIcon className="size-5 text-primary" />
            Tren Penjualan 12 Bulan
          </h2>
          <p className="text-sm text-muted-foreground">Pendapatan, volume, dan laba kotor per bulan.</p>
        </div>
        <div className="space-y-1">
          <label htmlFor="trend-year" className="text-xs font-medium text-muted-foreground">
            Tahun
          </label>
          <select
            id="trend-year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="h-9 w-32 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Memuat tren penjualan…</p>
      ) : error ? (
        <p className="py-10 text-center text-sm text-destructive">{error}</p>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard title="Total Penjualan" value={rupiah(totalSales)} hint={`${activeMonths} bulan aktif`} />
            <KpiCard title="Laba Kotor" value={rupiah(totalProfit)} tone="positive" />
            <KpiCard
              title="Margin Kotor"
              value={totalSales > 0 ? pct((totalProfit / totalSales) * 100) : "-"}
              tone="positive"
            />
            <KpiCard
              title="Total Volume"
              value={qty(trends.reduce((s, t) => s + num(t.total_volume), 0))}
              hint="Karton terkirim"
            />
          </div>

          <SalesTrendChart trends={data.trends} />

          <Card>
            <CardHeader>
              <CardTitle>Rincian Bulanan {data.year}</CardTitle>
              <CardDescription>Periode, penjualan, volume, HPP, dan laba kotor</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bulan</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead className="text-right">Penjualan</TableHead>
                    <TableHead className="text-right">Volume</TableHead>
                    <TableHead className="text-right">HPP</TableHead>
                    <TableHead className="text-right">Laba Kotor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.trends.map((t) => (
                    <TableRow key={t.month}>
                      <TableCell className="font-medium">{t.month_name}</TableCell>
                      <TableCell className="text-muted-foreground">{t.period || "-"}</TableCell>
                      <TableCell className="text-right tabular-nums">{rupiah(t.total_sales)}</TableCell>
                      <TableCell className="text-right tabular-nums">{qty(t.total_volume)}</TableCell>
                      <TableCell className="text-right tabular-nums">{rupiah(t.total_cogs)}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{rupiah(t.gross_profit)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
