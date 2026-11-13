"use client";

import { DistributionPieChart } from "@/components/app/charts";
import { SvgIcon } from "@/components/app/svg-sprites";
import { num, pct, qty, rupiah } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import type { PieChartsReport } from "@/types/api";

export default function PieChartsPage() {
  const { data, loading, error } = useApi<PieChartsReport>("/finance/reports/pie-charts/");

  return (
    <div className="space-y-4">
      {loading ? (
        <section className="panel">
          <div className="empty-state">
            <SvgIcon name="doc" />
            <p>Memuat analitik persediaan…</p>
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
          <section className="metric-grid" aria-label="Ringkasan nilai persediaan">
            <article className="metric">
              <div>
                <span>Total Nilai Persediaan</span>
                <SvgIcon name="box" />
              </div>
              <strong>{rupiah(data.total_portfolio_value)}</strong>
              <small>Akumulasi seluruh gudang</small>
            </article>
            <article className="metric">
              <div>
                <span>Jumlah Merek</span>
                <SvgIcon name="layers" />
              </div>
              <strong>{data.brand_distribution.length} merek</strong>
              <small>Distribusi portofolio merek</small>
            </article>
            <article className="metric">
              <div>
                <span>Varian Kemasan</span>
                <SvgIcon name="bag" />
              </div>
              <strong>{data.package_size_distribution.length} ukuran</strong>
              <small>Distribusi ukuran kemasan</small>
            </article>
          </section>

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
                { title: "Rincian per merek", rows: data.brand_distribution },
                { title: "Rincian per kemasan", rows: data.package_size_distribution },
              ] as const
            ).map((section) => (
              <section key={section.title} className="panel scroll">
                <div className="panelhead">
                  <div>
                    <h2>{section.title}</h2>
                    <p>Nilai stok, kuantitas, dan persentase kontribusi.</p>
                  </div>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Kategori</th>
                      <th className="text-right">Kuantitas</th>
                      <th className="text-right">Nilai Stok</th>
                      <th className="text-right">Kontribusi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.rows.map((row) => (
                      <tr key={row.label}>
                        <td>
                          <strong>{row.label}</strong>
                        </td>
                        <td className="text-right tabular-nums">{qty(row.stock_qty)}</td>
                        <td className="text-right tabular-nums">{rupiah(row.stock_value)}</td>
                        <td className="text-right tabular-nums">{pct(row.percentage)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td>
                        <strong>Total</strong>
                      </td>
                      <td className="text-right tabular-nums">
                        <strong>{qty(section.rows.reduce((s, r) => s + num(r.stock_qty), 0))}</strong>
                      </td>
                      <td className="text-right tabular-nums">
                        <strong>{rupiah(section.rows.reduce((s, r) => s + num(r.stock_value), 0))}</strong>
                      </td>
                      <td className="text-right tabular-nums">
                        <strong>100%</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </section>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
