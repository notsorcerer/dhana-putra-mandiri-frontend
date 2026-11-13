"use client";

import { useState } from "react";
import { Scale } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "@/components/app/kpi-card";
import { num, rupiah, todayIso } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import type { BalanceSheet } from "@/types/api";

export default function BalanceSheetPage() {
  const [asOf, setAsOf] = useState(todayIso());
  const { data, loading, error } = useApi<BalanceSheet>(`/finance/reports/balance-sheet/?as_of_date=${asOf}`);

  const renderSection = (
    title: string,
    rows: { label: string; value: number; strong?: boolean }[],
  ) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell className={row.strong ? "font-semibold" : undefined}>{row.label}</TableCell>
                <TableCell className={`text-right tabular-nums ${row.strong ? "font-semibold" : ""}`}>
                  {rupiah(row.value)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Scale className="size-5 text-primary" />
            Neraca (Balance Sheet)
          </h2>
          <p className="text-sm text-muted-foreground">Posisi keuangan per tanggal tertentu.</p>
        </div>
        <div className="space-y-1">
          <label htmlFor="as-of" className="text-xs font-medium text-muted-foreground">
            Per Tanggal
          </label>
          <Input id="as-of" type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} className="w-44" />
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Menyusun neraca…</p>
      ) : error ? (
        <p className="py-10 text-center text-sm text-destructive">{error}</p>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard title="Total Aktiva" value={rupiah(data.assets.total_assets)} />
            <KpiCard title="Total Kewajiban" value={rupiah(data.liabilities.total_liabilities)} />
            <KpiCard title="Total Ekuitas" value={rupiah(data.equity.total_equity)} />
            <KpiCard
              title="Selisih Neraca"
              value={rupiah(data.summary.difference)}
              tone={data.summary.is_balanced ? "positive" : "negative"}
              hint={data.summary.is_balanced ? "Neraca seimbang (D = K)" : "Neraca belum seimbang"}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {renderSection("Aktiva", [
              { label: "Kas Tunai", value: num(data.assets.kas_dan_bank.kas_tunai) },
              { label: "Bank BCA", value: num(data.assets.kas_dan_bank.bank_bca) },
              { label: "Bank Mandiri", value: num(data.assets.kas_dan_bank.bank_mandiri) },
              { label: "Subtotal Kas & Bank", value: num(data.assets.kas_dan_bank.subtotal), strong: true },
              { label: "Piutang Usaha", value: num(data.assets.piutang_usaha) },
              { label: "Persediaan Barang Dagang", value: num(data.assets.persediaan_barang_dagang) },
              { label: "Total Aktiva", value: num(data.assets.total_assets), strong: true },
            ])}
            {renderSection("Kewajiban", [
              { label: "Hutang Usaha Supplier", value: num(data.liabilities.hutang_usaha_supplier) },
              { label: "Hutang Gaji & Upah", value: num(data.liabilities.hutang_gaji_upah) },
              { label: "Hutang Ongkos Bongkar", value: num(data.liabilities.hutang_ongkos_bongkar) },
              { label: "Total Kewajiban", value: num(data.liabilities.total_liabilities), strong: true },
            ])}
            {renderSection("Ekuitas", [
              { label: "Modal Disetor", value: num(data.equity.modal_disetor) },
              { label: "Laba Ditahan", value: num(data.equity.laba_ditahan) },
              { label: "Laba Periode Berjalan", value: num(data.equity.laba_periode_berjalan) },
              { label: "Total Ekuitas", value: num(data.equity.total_equity), strong: true },
            ])}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ringkasan</CardTitle>
              <CardDescription>
                Per tanggal {data.as_of_date} — total aktiva vs total kewajiban & ekuitas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Komponen</TableHead>
                    <TableHead className="text-right">Nilai</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Total Aktiva</TableCell>
                    <TableCell className="text-right tabular-nums">{rupiah(data.summary.total_assets)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Kewajiban & Ekuitas</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {rupiah(data.summary.total_liabilities_and_equity)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Selisih</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {rupiah(data.summary.difference)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
