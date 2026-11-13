"use client";

import Link from "next/link";
import { PeriodFilter } from "@/components/app/period-filter";
import { GradeBadge } from "@/components/app/status-badge";
import { qty } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import type { StockEstimationRow } from "@/types/api";

export default function StockEstimationPage() {
  const { data, loading, error } = useApi<StockEstimationRow[]>(
    "/inventory/products/stock-estimation/",
  );

  const sorted = [...(data ?? [])].sort(
    (a, b) => a.estimated_stock_days - b.estimated_stock_days,
  );
  const belowCount = sorted.filter((r) => r.is_stock_below_28_days).length;

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">PERENCANAAN PERSEDIAAN</div>
          <h1>Pengisian stok</h1>
          <p>
            Estimasi ketahanan stok per produk berdasarkan konsumsi harian rata-rata
          </p>
        </div>
        <div className="inline-actions">
          <PeriodFilter />
          <Link className="outline" href="/goods-receipts/new">
            + Catat penerimaan
          </Link>
        </div>
      </div>

      {belowCount > 0 ? (
        <p className="notice">
          Terdapat <strong>{belowCount} produk</strong> dengan cakupan stok di bawah
          ambang 28 hari yang memerlukan pengisian ulang.
        </p>
      ) : null}

      <section className="panel">
        <div className="panelhead">
          <div>
            <small>ESTIMASI PERMINTAAN</small>
            <h2>Prioritas pengisian stok</h2>
          </div>
        </div>
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Kode</th>
                <th>Varian produk</th>
                <th>Kelas</th>
                <th>Stok tersedia</th>
                <th>Estimasi per hari</th>
                <th>Cakupan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}>Memuat estimasi stok…</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="errorlist">
                    {error}
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={7}>Belum ada produk aktif.</td>
                </tr>
              ) : (
                sorted.map((row) => (
                  <tr key={row.id}>
                    <td className="doc-number">{row.sku}</td>
                    <td>
                      {row.brand} {row.package_size} · {row.name}
                    </td>
                    <td>
                      <GradeBadge grade={row.abc_class} />
                    </td>
                    <td>
                      {qty(row.current_stock)} {row.uom}
                    </td>
                    <td>
                      {qty(row.daily_consumption_rate)} {row.uom}
                    </td>
                    <td>
                      {Number(row.estimated_stock_days).toLocaleString("id-ID", {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}{" "}
                      hari
                    </td>
                    <td>
                      <span
                        className="status-chip"
                        data-tone={row.is_stock_below_28_days ? "warning" : "positive"}
                      >
                        {row.is_stock_below_28_days ? "Berisiko" : "Aman"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
