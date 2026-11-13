"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "@/components/app/kpi-card";
import { availableYears, num, pct, qty, rupiah } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import type { AnnualReport } from "@/types/api";

export default function AnnualReportPage() {
  const years = availableYears();
  const [year, setYear] = useState<string>(String(years[years.length - 1]));
  const { data, loading, error } = useApi<AnnualReport>(`/finance/reports/annual-report/?year=${year}`);

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <TrendingUp className="size-5 text-primary" />
            Ringkasan Keuangan Tahunan
          </h2>
          <p className="text-sm text-muted-foreground">
            Pendapatan, laba kotor, beban operasional, dan laba bersih operasional.
          </p>
        </div>
        <div className="space-y-1">
          <label htmlFor="annual-year" className="text-xs font-medium text-muted-foreground">
            Tahun
          </label>
          <select
            id="annual-year"
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
        <p className="py-10 text-center text-sm text-muted-foreground">Menyusun ringkasan tahunan…</p>
      ) : error ? (
        <p className="py-10 text-center text-sm text-destructive">{error}</p>
      ) : data && summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard title="Total Pendapatan" value={rupiah(summary.total_revenue)} />
            <KpiCard title="Laba Kotor" value={rupiah(summary.gross_profit)} tone="positive" />
            <KpiCard title="Beban Operasional" value={rupiah(summary.operating_expenses.total)} tone="warning" />
            <KpiCard
              title="Laba Bersih Operasional"
              value={rupiah(summary.net_operating_profit)}
              tone={num(summary.net_operating_profit) >= 0 ? "positive" : "negative"}
              hint={`Margin bersih ${pct(summary.net_profit_margin_pct)}`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Laporan Laba Rugi Ringkas {data.year}</CardTitle>
                <CardDescription>Struktur laba rugi satu tahun penuh</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>Pendapatan Penjualan</TableCell>
                      <TableCell className="text-right tabular-nums">{rupiah(summary.total_revenue)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Harga Pokok Penjualan (HPP)</TableCell>
                      <TableCell className="text-right tabular-nums">({rupiah(summary.total_cogs)})</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">Laba Kotor</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {rupiah(summary.gross_profit)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-6 text-muted-foreground">Beban Bongkar Muat (Kuli)</TableCell>
                      <TableCell className="text-right tabular-nums">
                        ({rupiah(summary.operating_expenses.kuli_bongkar_expense)})
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-6 text-muted-foreground">Beban Gaji & Upah</TableCell>
                      <TableCell className="text-right tabular-nums">
                        ({rupiah(summary.operating_expenses.payroll_expense)})
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-6 text-muted-foreground">Beban Transportasi Armada</TableCell>
                      <TableCell className="text-right tabular-nums">
                        ({rupiah(summary.operating_expenses.armada_transport_expense)})
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-6 text-muted-foreground">Beban Kantor & Umum</TableCell>
                      <TableCell className="text-right tabular-nums">
                        ({rupiah(summary.operating_expenses.office_general_expense)})
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">Total Beban Operasional</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        ({rupiah(summary.operating_expenses.total)})
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">Laba Bersih Operasional</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {rupiah(summary.net_operating_profit)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rincian Bulanan {data.year}</CardTitle>
                <CardDescription>Penjualan dan laba kotor per bulan</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bulan</TableHead>
                      <TableHead className="text-right">Penjualan</TableHead>
                      <TableHead className="text-right">Volume</TableHead>
                      <TableHead className="text-right">Laba Kotor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.monthly_breakdown.map((t) => (
                      <TableRow key={t.month}>
                        <TableCell className="font-medium">{t.month_name}</TableCell>
                        <TableCell className="text-right tabular-nums">{rupiah(t.total_sales)}</TableCell>
                        <TableCell className="text-right tabular-nums">{qty(t.total_volume)}</TableCell>
                        <TableCell className="text-right tabular-nums">{rupiah(t.gross_profit)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {data.top_products && data.top_products.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>5 Produk Teratas {data.year}</CardTitle>
                <CardDescription>Berdasarkan pendapatan</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead className="text-right">Terjual</TableHead>
                      <TableHead className="text-right">Pendapatan</TableHead>
                      <TableHead className="text-right">Laba Kotor</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.top_products.map((row) => (
                      <TableRow key={row.sku}>
                        <TableCell>
                          <p className="font-medium">{row.name}</p>
                          <p className="text-xs text-muted-foreground">{row.sku}</p>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {qty(row.qty_sold)} {row.uom}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{rupiah(row.revenue)}</TableCell>
                        <TableCell className="text-right tabular-nums">{rupiah(row.gross_profit)}</TableCell>
                        <TableCell className="text-right tabular-nums">{pct(row.margin_percentage)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
