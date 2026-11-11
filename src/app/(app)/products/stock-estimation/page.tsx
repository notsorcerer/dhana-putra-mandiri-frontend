"use client";

import { AlertTriangle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { qty } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import type { StockEstimationRow } from "@/types/api";

export default function StockEstimationPage() {
  const { data, loading, error } = useApi<StockEstimationRow[]>("/inventory/products/stock-estimation/");

  const sorted = [...(data ?? [])].sort((a, b) => a.estimated_stock_days - b.estimated_stock_days);
  const belowCount = sorted.filter((r) => r.is_stock_below_28_days).length;

  return (
    <div>
      <PageHeader
        title="Estimasi Stok"
        description="Perkiraan hari ketahanan stok per produk berdasarkan konsumsi harian rata-rata. Ambang kritis: 28 hari."
      />

      {belowCount > 0 ? (
        <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <AlertTriangle className="size-4 shrink-0" />
          <span>
            <span className="font-semibold">{belowCount} produk</span> berada di bawah ambang 28 hari — pertimbangkan
            penerimaan barang dari pemasok.
          </span>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Estimasi Seluruh Produk</CardTitle>
          <CardDescription>Diurutkan dari ketahanan stok paling singkat</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="py-8 text-center text-sm text-destructive">{error}</p>
          ) : sorted.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Belum ada produk aktif.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead>Kelas ABC</TableHead>
                  <TableHead className="text-right">Stok Saat Ini</TableHead>
                  <TableHead className="text-right">Konsumsi / Hari</TableHead>
                  <TableHead className="text-right">Estimasi Ketahanan</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <p className="font-medium">{row.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.sku} · {row.brand} · {row.package_size}
                      </p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.abc_class} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {qty(row.current_stock)} {row.uom}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {qty(row.daily_consumption_rate)} {row.uom}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {qty(row.estimated_stock_days)} hari
                    </TableCell>
                    <TableCell>
                      {row.is_stock_below_28_days ? (
                        <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                          Di bawah 28 hari
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                          Aman
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
