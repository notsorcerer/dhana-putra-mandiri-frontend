"use client";

import { useState } from "react";
import { SvgIcon } from "@/components/app/svg-sprites";
import { availableYears, num, pct, qty, rupiah } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import type { AnnualReport } from "@/types/api";

export default function AnnualReportPage() {
  const years = availableYears();
  const [year, setYear] = useState<string>(String(years[years.length - 1]));
  const { data, loading, error } = useApi<AnnualReport>(`/finance/reports/annual-report/?year=${year}`);

  const summary = data?.summary;

  return (
    <div className="space-y-4">
      <form className="table-tools" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="annual-year">
          Tahun laporan
          <select id="annual-year" value={year} onChange={(e) => setYear(e.target.value)}>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </form>

      {loading ? (
        <section className="panel">
          <div className="empty-state">
            <SvgIcon name="doc" />
            <p>Menyusun ringkasan tahunan…</p>
          </div>
        </section>
      ) : error ? (
        <section className="panel">
          <div className="empty-state">
            <SvgIcon name="alert" />
            <p className="text-destructive">{error}</p>
          </div>
        </section>
      ) : data && summary ? (
        <>
          <section className="metric-grid" aria-label="Ringkasan keuangan tahunan">
            <article className="metric">
              <div>
                <span>Total Pendapatan</span>
                <SvgIcon name="sales" />
              </div>
              <strong>{rupiah(summary.total_revenue)}</strong>
              <small>Omzet tahun {data.year}</small>
            </article>
            <article className="metric">
              <div>
                <span>Laba Kotor</span>
                <SvgIcon name="trend" />
              </div>
              <strong>{rupiah(summary.gross_profit)}</strong>
              <small className="up">Setelah HPP {rupiah(summary.total_cogs)}</small>
            </article>
            <article className="metric">
              <div>
                <span>Beban Operasional</span>
                <SvgIcon name="wallet" />
              </div>
              <strong>{rupiah(summary.operating_expenses.total)}</strong>
              <small>Gaji, kuli bongkar, armada & umum</small>
            </article>
            <article className="metric">
              <div>
                <span>Laba Bersih Operasional</span>
                <SvgIcon name="report" />
              </div>
              <strong>{rupiah(summary.net_operating_profit)}</strong>
              <small className={num(summary.net_operating_profit) >= 0 ? "up" : "down"}>
                Margin bersih {pct(summary.net_profit_margin_pct)}
              </small>
            </article>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="panel scroll">
              <div className="panelhead">
                <div>
                  <h2>Laporan laba rugi ringkas {data.year}</h2>
                  <p>Struktur laba rugi operasional satu tahun penuh.</p>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Komponen</th>
                    <th className="text-right">Nilai</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Pendapatan Penjualan</td>
                    <td className="text-right tabular-nums">{rupiah(summary.total_revenue)}</td>
                  </tr>
                  <tr>
                    <td>Harga Pokok Penjualan (HPP)</td>
                    <td className="text-right tabular-nums">({rupiah(summary.total_cogs)})</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Laba Kotor</strong>
                    </td>
                    <td className="text-right tabular-nums">
                      <strong>{rupiah(summary.gross_profit)}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td className="pl-6 text-muted-foreground">Beban Bongkar Muat (Kuli)</td>
                    <td className="text-right tabular-nums">
                      ({rupiah(summary.operating_expenses.kuli_bongkar_expense)})
                    </td>
                  </tr>
                  <tr>
                    <td className="pl-6 text-muted-foreground">Beban Gaji & Upah</td>
                    <td className="text-right tabular-nums">
                      ({rupiah(summary.operating_expenses.payroll_expense)})
                    </td>
                  </tr>
                  <tr>
                    <td className="pl-6 text-muted-foreground">Beban Transportasi Armada</td>
                    <td className="text-right tabular-nums">
                      ({rupiah(summary.operating_expenses.armada_transport_expense)})
                    </td>
                  </tr>
                  <tr>
                    <td className="pl-6 text-muted-foreground">Beban Kantor & Umum</td>
                    <td className="text-right tabular-nums">
                      ({rupiah(summary.operating_expenses.office_general_expense)})
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Total Beban Operasional</strong>
                    </td>
                    <td className="text-right tabular-nums">
                      <strong>({rupiah(summary.operating_expenses.total)})</strong>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Laba Bersih Operasional</strong>
                    </td>
                    <td className="text-right tabular-nums">
                      <strong>{rupiah(summary.net_operating_profit)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section className="panel scroll">
              <div className="panelhead">
                <div>
                  <h2>Rincian bulanan {data.year}</h2>
                  <p>Penjualan, volume, dan laba kotor per bulan.</p>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Bulan</th>
                    <th className="text-right">Penjualan</th>
                    <th className="text-right">Volume</th>
                    <th className="text-right">Laba Kotor</th>
                  </tr>
                </thead>
                <tbody>
                  {data.monthly_breakdown.map((t) => (
                    <tr key={t.month}>
                      <td>
                        <strong>{t.month_name}</strong>
                      </td>
                      <td className="text-right tabular-nums">{rupiah(t.total_sales)}</td>
                      <td className="text-right tabular-nums">{qty(t.total_volume)}</td>
                      <td className="text-right tabular-nums">{rupiah(t.gross_profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>

          {data.top_products && data.top_products.length > 0 ? (
            <section className="panel scroll">
              <div className="panelhead">
                <div>
                  <h2>5 produk teratas {data.year}</h2>
                  <p>Diurutkan berdasarkan kontribusi pendapatan.</p>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th className="text-right">Terjual</th>
                    <th className="text-right">Pendapatan</th>
                    <th className="text-right">Laba Kotor</th>
                    <th className="text-right">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_products.map((row) => (
                    <tr key={row.sku}>
                      <td>
                        <strong>{row.name}</strong>
                        <div className="text-xs text-muted-foreground">{row.sku}</div>
                      </td>
                      <td className="text-right tabular-nums">
                        {qty(row.qty_sold)} {row.uom}
                      </td>
                      <td className="text-right tabular-nums">{rupiah(row.revenue)}</td>
                      <td className="text-right tabular-nums">{rupiah(row.gross_profit)}</td>
                      <td className="text-right tabular-nums">{pct(row.margin_percentage)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
