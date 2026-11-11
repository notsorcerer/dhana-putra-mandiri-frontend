"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { num, pct, qty, rupiah } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import type { AbcRow } from "@/types/api";

const CLASS_DESCRIPTION: Record<string, string> = {
  A: "Kelas A — 80% nilai kumulatif teratas. Prioritas pengendalian stok paling ketat.",
  B: "Kelas B — 15% nilai kumulatif berikutnya. Pengendalian periodik.",
  C: "Kelas C — 5% nilai kumulatif terbawah. Pengendalian longgar / stok pengaman.",
};

export default function AbcAnalysisPage() {
  const { data, loading, error } = useApi<Record<"A" | "B" | "C", AbcRow[]>>("/inventory/products/abc-analysis/");

  const renderTable = (rows: AbcRow[] | undefined) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Produk</TableHead>
          <TableHead className="text-right">Stok</TableHead>
          <TableHead className="text-right">HPP Rata-rata</TableHead>
          <TableHead className="text-right">Nilai Persediaan</TableHead>
          <TableHead className="text-right">% Kontribusi</TableHead>
          <TableHead className="text-right">Kumulatif</TableHead>
          <TableHead className="text-right">Runway</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
              Menghitung klasifikasi ABC…
            </TableCell>
          </TableRow>
        ) : error ? (
          <TableRow>
            <TableCell colSpan={7} className="py-8 text-center text-sm text-destructive">
              {error}
            </TableCell>
          </TableRow>
        ) : !rows || rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
              Tidak ada produk pada kelas ini.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.sku}>
              <TableCell>
                <p className="font-medium">{row.name}</p>
                <p className="text-xs text-muted-foreground">{row.sku}</p>
              </TableCell>
              <TableCell className="text-right tabular-nums">{qty(row.current_stock)}</TableCell>
              <TableCell className="text-right tabular-nums">{rupiah(row.moving_average_hpp)}</TableCell>
              <TableCell className="text-right tabular-nums">{rupiah(row.total_value)}</TableCell>
              <TableCell className="text-right tabular-nums">{pct(row.percentage)}</TableCell>
              <TableCell className="text-right tabular-nums">{pct(row.cumulative_percentage)}</TableCell>
              <TableCell className="text-right">
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums ${
                    row.is_stock_below_28_days
                      ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {qty(row.estimated_runway_days)} hari
                </span>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  const totalCount = data ? data.A.length + data.B.length + data.C.length : 0;
  const totalValue = data
    ? num(data.A.reduce((s, r) => s + r.total_value, 0)) +
      num(data.B.reduce((s, r) => s + r.total_value, 0)) +
      num(data.C.reduce((s, r) => s + r.total_value, 0))
    : 0;

  return (
    <div>
      <PageHeader
        title="Analisis ABC Persediaan"
        description={`Klasifikasi produk berdasarkan kontribusi nilai persediaan — ${totalCount} produk aktif, total nilai ${rupiah(totalValue)}.`}
      />

      <Tabs defaultValue="A">
        <TabsList>
          <TabsTrigger value="A">
            Kelas A {data ? `(${data.A.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="B">
            Kelas B {data ? `(${data.B.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="C">
            Kelas C {data ? `(${data.C.length})` : ""}
          </TabsTrigger>
        </TabsList>
        {(["A", "B", "C"] as const).map((cls) => (
          <TabsContent key={cls} value={cls} className="space-y-3">
            <div className="flex items-center gap-2">
              <StatusBadge status={cls} />
              <p className="text-sm text-muted-foreground">{CLASS_DESCRIPTION[cls]}</p>
            </div>
            <div className="overflow-hidden rounded-lg border">{renderTable(data?.[cls])}</div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
