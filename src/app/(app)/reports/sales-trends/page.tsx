"use client";

import { useState } from "react";
import { SalesTrendChart } from "@/components/app/charts";
import { SvgIcon } from "@/components/app/svg-sprites";
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
    <div className="space-y-4">
      <form className="table-tools" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="trend-year">
          Tahun laporan
          <select id="trend-year" value={year} onChange={(e) => setYear(e.target.value)}>
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
            <p>Memuat tren penjualan…</p>
          </div>
        </section>
      ) : error ? (
        <section className="panel">
          <div className="empty-state">
            <SvgIcon name="alert" />
            <p className="text-destructive">{error}</p>
          </div>
        </section>
      ) : data ? (
        <>
          <section className="metric-grid" aria-label="Ringkasan tren penjualan">
            <article className="metric">
              <div>
                <span>Total Penjualan</span>
                <SvgIcon name="sales" />
              </div>
              <strong>{rupiah(totalSales)}</strong>
              <small>{activeMonths} bulan aktif</small>
            </article>
            <article className="metric">
              <div>
                <span>Laba Kotor</span>
                <SvgIcon name="trend" />
              </div>
              <strong>{rupiah(totalProfit)}</strong>
              <small className="up">Akumulasi tahun {data.year}</small>
            </article>
            <article className="metric">
              <div>
                <span>Margin Kotor</span>
                <SvgIcon name="percent" />
              </div>
              <strong>{totalSales > 0 ? pct((totalProfit / totalSales) * 100) : "-"}</strong>
              <small className="up">Rasio laba kotor terhadap omzet</small>
            </article>
            <article className="metric">
              <div>
                <span>Total Volume</span>
                <SvgIcon name="box" />
              </div>
              <strong>{qty(trends.reduce((s, t) => s + num(t.total_volume), 0))}</strong>
              <small>Karton terkirim</small>
            </article>
          </section>

          <SalesTrendChart trends={data.trends} />

          <section className="panel scroll">
            <div className="panelhead">
              <div>
                <h2>Rincian bulanan {data.year}</h2>
                <p>Periode, penjualan, volume, HPP, dan laba kotor.</p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Bulan</th>
                  <th>Periode</th>
                  <th className="text-right">Penjualan</th>
                  <th className="text-right">Volume</th>
                  <th className="text-right">HPP</th>
                  <th className="text-right">Laba Kotor</th>
                </tr>
              </thead>
              <tbody>
                {data.trends.map((t) => (
                  <tr key={t.month}>
                    <td>
                      <strong>{t.month_name}</strong>
                    </td>
                    <td>{t.period || "-"}</td>
                    <td className="text-right tabular-nums">{rupiah(t.total_sales)}</td>
                    <td className="text-right tabular-nums">{qty(t.total_volume)}</td>
                    <td className="text-right tabular-nums">{rupiah(t.total_cogs)}</td>
                    <td className="text-right tabular-nums">
                      <strong>{rupiah(t.gross_profit)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      ) : null}
    </div>
  );
}
