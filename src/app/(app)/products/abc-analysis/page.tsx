"use client";

import Link from "next/link";
import { PeriodFilter } from "@/components/app/period-filter";
import { GradeBadge } from "@/components/app/status-badge";
import { useAuth } from "@/lib/auth";
import { pct, qty, rupiah } from "@/lib/format";
import { CAN, can } from "@/lib/menu";
import { useApi } from "@/lib/use-api";
import type { AbcRow, StockEstimationRow } from "@/types/api";

/**
 * Halaman Analisis Persediaan (Klasifikasi ABC & Estimasi Permintaan):
 * paritas penuh dengan templates/mining.html.
 */
export default function AbcAnalysisPage() {
  const { session } = useAuth();
  const showFinancial = can(CAN.viewFinancialValues, session?.role);

  const { data: abcData, loading: abcLoading, error: abcError } = useApi<
    Record<"A" | "B" | "C", AbcRow[]>
  >("/inventory/products/abc-analysis/");
  const { data: estData } = useApi<StockEstimationRow[]>(
    "/inventory/products/stock-estimation/",
  );

  const abcRows = abcData
    ? [
        ...abcData.A.map((r) => ({ ...r, cls: "A" as const })),
        ...abcData.B.map((r) => ({ ...r, cls: "B" as const })),
        ...abcData.C.map((r) => ({ ...r, cls: "C" as const })),
      ]
    : [];

  const estRows = [...(estData ?? [])].sort(
    (a, b) => a.estimated_stock_days - b.estimated_stock_days,
  );

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">DATA MINING</div>
          <h1>Analisis persediaan</h1>
          <p>Klasifikasi ABC dan estimasi risiko kehabisan stok</p>
        </div>
        <PeriodFilter />
      </div>

      <div className="tabs">
        <Link href="/products">Persediaan</Link>
        <Link href="/products/abc-analysis" aria-current="page">
          Analisis ABC dan risiko
        </Link>
        <Link href="/stock-movements">Kartu & pergerakan stok</Link>
      </div>

      <section className="panel">
        <div className="panelhead">
          <div>
            <small>KLASIFIKASI ABC</small>
            <h2>Prioritas pemeriksaan stok</h2>
          </div>
        </div>
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Produk</th>
                <th>Kelas</th>
                <th>Stok</th>
                {showFinancial ? (
                  <>
                    <th>HPP rata-rata</th>
                    <th>Nilai persediaan</th>
                    <th>Kontribusi</th>
                    <th>Kumulatif</th>
                  </>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {abcLoading ? (
                <tr>
                  <td colSpan={showFinancial ? 7 : 3}>Menghitung klasifikasi ABC…</td>
                </tr>
              ) : abcError ? (
                <tr>
                  <td colSpan={showFinancial ? 7 : 3} className="errorlist">
                    {abcError}
                  </td>
                </tr>
              ) : abcRows.length === 0 ? (
                <tr>
                  <td colSpan={showFinancial ? 7 : 3}>Belum ada produk.</td>
                </tr>
              ) : (
                abcRows.map((r) => (
                  <tr key={r.sku}>
                    <td>
                      <Link href="/stock-movements">
                        {r.sku} · {r.name}
                      </Link>
                    </td>
                    <td>
                      <GradeBadge grade={r.cls} />
                    </td>
                    <td>{qty(r.current_stock)}</td>
                    {showFinancial ? (
                      <>
                        <td>{rupiah(r.moving_average_hpp)}</td>
                        <td>{rupiah(r.total_value)}</td>
                        <td>{pct(r.percentage)}</td>
                        <td>{pct(r.cumulative_percentage)}</td>
                      </>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panelhead">
          <div>
            <small>ESTIMASI PERMINTAAN</small>
            <h2>Risiko kehabisan stok</h2>
            <p>
              Perkiraan hari cakupan stok dibandingkan ambang aman 28 hari berdasarkan
              rata-rata konsumsi harian.
            </p>
          </div>
        </div>
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Produk</th>
                <th>Estimasi per hari</th>
                <th>Cakupan / batas aman</th>
                <th>Status dan alasan</th>
                <th>Stok tersedia</th>
              </tr>
            </thead>
            <tbody>
              {estRows.length === 0 ? (
                <tr>
                  <td colSpan={5}>Belum ada data estimasi permintaan.</td>
                </tr>
              ) : (
                estRows.map((r) => {
                  const isRisk = r.is_stock_below_28_days;
                  const cov = Number(r.estimated_stock_days).toLocaleString("id-ID", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  });
                  return (
                    <tr key={r.id}>
                      <td>
                        {r.sku} · {r.brand} {r.package_size}
                      </td>
                      <td>
                        {qty(r.daily_consumption_rate)} {r.uom}
                      </td>
                      <td>{cov} / 28 hari</td>
                      <td>
                        <strong>{isRisk ? "Berisiko" : "Aman"}</strong>
                        {isRisk ? (
                          <>
                            <br />
                            Stok cukup {cov} hari, batas aman 28 hari.
                          </>
                        ) : null}
                      </td>
                      <td>
                        {qty(r.current_stock)} {r.uom}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
