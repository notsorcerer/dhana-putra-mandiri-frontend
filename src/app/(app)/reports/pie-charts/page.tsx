"use client";

import { ChartPie } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DistributionPieChart } from "@/components/app/charts";
import { KpiCard } from "@/components/app/kpi-card";
import { num, pct, qty, rupiah } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import type { PieChartsReport } from "@/types/api";

export default function PieChartsPage() {
  const { data, loading, error } = useApi<PieChartsReport>("/finance/reports/pie-charts/");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <ChartPie className="size-5 text-primary" />
          Distribusi Persediaan
        </h2>
        <p className="text-sm text-muted-foreground">
          Proporsi nilai stok berdasarkan merek dan ukuran kemasan produk.
        </p>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Memuat analitik persediaan…</p>
      ) : error ? (
        <p className="py-10 text-center text-sm text-destructive">{error}</p>
      ) : data ? (
        <>
          <KpiCard title="Total Nilai Persediaan" value={rupiah(data.total_portfolio_value)} />

          <div className="grid gap-4 lg:grid-cols-2">
            <DistributionPieChart
              title="Distribusi per Merek"
              description="Persentase nilai persediaan tiap merek"
              data={data.brand_distribution}
            />
            <DistributionPieChart
              title="Distribusi per Kemasan"
              description="Persentase nilai persediaan tiap ukuran kemasan"
              data={data.package_size_distribution}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {(
              [
                { title: "Rincian per Merek", rows: data.brand_distribution },
                { title: "Rincian per Kemasan", rows: data.package_size_distribution },
              ] as const
            ).map((section) => (
              <Card key={section.title}>
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                  <CardDescription>Nilai stok, kuantitas, dan kontribusi</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kategori</TableHead>
                        <TableHead className="text-right">Kuantitas</TableHead>
                        <TableHead className="text-right">Nilai Stok</TableHead>
                        <TableHead className="text-right">Kontribusi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {section.rows.map((row) => (
                        <TableRow key={row.label}>
                          <TableCell className="font-medium">{row.label}</TableCell>
                          <TableCell className="text-right tabular-nums">{qty(row.stock_qty)}</TableCell>
                          <TableCell className="text-right tabular-nums">{rupiah(row.stock_value)}</TableCell>
                          <TableCell className="text-right tabular-nums">{pct(row.percentage)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell className="font-semibold">Total</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {qty(section.rows.reduce((s, r) => s + num(r.stock_qty), 0))}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {rupiah(section.rows.reduce((s, r) => s + num(r.stock_value), 0))}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">100%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
