"use client";

import { useState } from "react";
import { SvgIcon } from "@/components/app/svg-sprites";
import { availableYears, num, pct, qty, rupiah } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import type { ProductSalesReport } from "@/types/api";

export default function ProductSalesPage() {
  const years = availableYears();
  const [year, setYear] = useState<string>(String(years[years.length - 1]));
  const { data, loading, error } = useApi<ProductSalesReport>(`/finance/reports/product-sales/?year=${year}`);

  const products = [...(data?.products ?? [])].sort((a, b) => num(b.revenue) - num(a.revenue));

  return (
    <div className="space-y-4">
      <form className="table-tools" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="ps-year">
          Tahun laporan
          <select id="ps-year" value={year} onChange={(e) => setYear(e.target.value)}>
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
            <p>Memuat laporan produk…</p>
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
          <section className="metric-grid" aria-label="Ringkasan penjualan produk">
            <article className="metric">
              <div>
                <span>Total Pendapatan</span>
                <SvgIcon name="sales" />
              </div>
              <strong>{rupiah(data.total_revenue)}</strong>
              <small>{products.length} SKU tercatat</small>
            </article>
            <article className="metric">
              <div>
                <span>Total HPP</span>
                <SvgIcon name="box" />
              </div>
              <strong>{rupiah(data.total_cogs)}</strong>
              <small>Harga pokok barang terjual</small>
            </article>
            <article className="metric">
              <div>
                <span>Total Laba Kotor</span>
                <SvgIcon name="trend" />
              </div>
              <strong>{rupiah(data.total_gross_profit)}</strong>
              <small className="up">
                {num(data.total_revenue) > 0
                  ? `Margin ${pct((num(data.total_gross_profit) / num(data.total_revenue)) * 100)}`
                  : "Belum ada transaksi"}
              </small>
            </article>
          </section>

          <section className="panel scroll">
            <div className="panelhead">
              <div>
                <h2>Peringkat produk {data.year}</h2>
                <p>Diurutkan dari pendapatan terbesar beserta margin kotor per SKU.</p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Produk</th>
                  <th className="text-right">Terjual</th>
                  <th className="text-right">Pendapatan</th>
                  <th className="text-right">HPP</th>
                  <th className="text-right">Laba Kotor</th>
                  <th className="text-right">Margin</th>
                  <th className="text-right">Stok Kini</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <SvgIcon name="doc" />
                        <p>Belum ada penjualan pada tahun ini.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((row) => (
                    <tr key={row.sku}>
                      <td>
                        <strong>{row.name}</strong>
                        <div className="text-xs text-muted-foreground">
                          {row.sku} · {row.brand} · {row.package_size}
                        </div>
                      </td>
                      <td className="text-right tabular-nums">
                        {qty(row.qty_sold)} {row.uom}
                      </td>
                      <td className="text-right tabular-nums">{rupiah(row.revenue)}</td>
                      <td className="text-right tabular-nums">{rupiah(row.cogs)}</td>
                      <td className="text-right tabular-nums">
                        <strong>{rupiah(row.gross_profit)}</strong>
                      </td>
                      <td className="text-right tabular-nums">{pct(row.margin_percentage)}</td>
                      <td className="text-right tabular-nums">{qty(row.current_stock)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        </>
      ) : null}
    </div>
  );
}
