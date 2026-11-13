"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "@/components/app/kpi-card";
import { availableYears, num, pct, qty, rupiah } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import type { ProductSalesReport } from "@/types/api";

export default function ProductSalesPage() {
  const years = availableYears();
  const [year, setYear] = useState<string>(String(years[years.length - 1]));
  const { data, loading, error } = useApi<ProductSalesReport>(`/finance/reports/product-sales/?year=${year}`);

  const products = [...(data?.products ?? [])].sort((a, b) => num(b.revenue) - num(a.revenue));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <BarChart3 className="size-5 text-primary" />
            Penjualan & Margin Produk
          </h2>
          <p className="text-sm text-muted-foreground">Kinerja penjualan per SKU beserta margin kotor.</p>
        </div>
        <div className="space-y-1">
          <label htmlFor="ps-year" className="text-xs font-medium text-muted-foreground">
            Tahun
          </label>
          <select
            id="ps-year"
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
        <p className="py-10 text-center text-sm text-muted-foreground">Memuat laporan produk…</p>
      ) : error ? (
        <p className="py-10 text-center text-sm text-destructive">{error}</p>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard title="Total Pendapatan" value={rupiah(data.total_revenue)} />
            <KpiCard title="Total HPP" value={rupiah(data.total_cogs)} tone="warning" />
            <KpiCard
              title="Total Laba Kotor"
              value={rupiah(data.total_gross_profit)}
              tone="positive"
              hint={data.total_revenue > 0 ? `Margin ${pct((num(data.total_gross_profit) / num(data.total_revenue)) * 100)}` : undefined}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Peringkat Produk {data.year}</CardTitle>
              <CardDescription>Diurutkan dari pendapatan terbesar</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead className="text-right">Terjual</TableHead>
                    <TableHead className="text-right">Pendapatan</TableHead>
                    <TableHead className="text-right">HPP</TableHead>
                    <TableHead className="text-right">Laba Kotor</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                    <TableHead className="text-right">Stok Kini</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                        Belum ada penjualan pada tahun ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((row) => (
                      <TableRow key={row.sku}>
                        <TableCell>
                          <p className="font-medium">{row.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.sku} · {row.brand} · {row.package_size}
                          </p>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {qty(row.qty_sold)} {row.uom}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{rupiah(row.revenue)}</TableCell>
                        <TableCell className="text-right tabular-nums">{rupiah(row.cogs)}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums">{rupiah(row.gross_profit)}</TableCell>
                        <TableCell className="text-right tabular-nums">{pct(row.margin_percentage)}</TableCell>
                        <TableCell className="text-right tabular-nums">{qty(row.current_stock)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
