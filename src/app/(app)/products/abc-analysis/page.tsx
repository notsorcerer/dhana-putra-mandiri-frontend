"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PeriodFilter } from "@/components/app/period-filter";
import { GradeBadge } from "@/components/app/status-badge";
import { fetchAllPages } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { num, pct, qty, rupiah } from "@/lib/format";
import { CAN, can } from "@/lib/menu";
import { useApi } from "@/lib/use-api";
import type { Product, StockEstimationRow } from "@/types/api";

/**
 * Halaman Analisis Persediaan (Klasifikasi ABC & Estimasi Permintaan):
 * paritas penuh dengan templates/mining.html.
 */
export default function AbcAnalysisPage() {
  const { session } = useAuth();
  const showFinancial = can(CAN.viewFinancialValues, session?.role);

  const [products, setProducts] = useState<Product[]>([]);
  const [abcLoading, setAbcLoading] = useState(true);
  const [abcError, setAbcError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setAbcLoading(true);
    fetchAllPages<Product>("/inventory/products/")
      .then((rows) => {
        if (active) {
          setProducts(rows.filter((p) => p.is_active));
          setAbcError(null);
        }
      })
      .catch((err) => {
        if (active) setAbcError(err instanceof Error ? err.message : "Gagal memuat produk.");
      })
      .finally(() => {
        if (active) setAbcLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const { data: estData } = useApi<StockEstimationRow[]>(
    "/inventory/products/stock-estimation/",
  );

  const abcRows = useMemo(() => {
    const withVal = products.map((p) => {
      const stock = num(p.current_stock);
      const hpp = num(p.moving_average_hpp ?? p.selling_price ?? 0);
      const totalVal = p.stock_value !== undefined ? num(p.stock_value) : stock * hpp;
      return {
        sku: p.sku,
        name: p.name,
        current_stock: stock,
        moving_average_hpp: hpp,
        total_value: totalVal,
        cls: (p.abc_class || "B") as "A" | "B" | "C",
      };
    });
    withVal.sort((a, b) => b.total_value - a.total_value || b.current_stock - a.current_stock);
    const grandTotal = withVal.reduce((s, r) => s + r.total_value, 0);
    let cum = 0;
    return withVal.map((r) => {
      const percentage = grandTotal > 0 ? (r.total_value / grandTotal) * 100 : 0;
      cum += percentage;
      return {
        ...r,
        percentage,
        cumulative_percentage: Math.min(100, cum),
      };
    });
  }, [products]);

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
                  const safeDays = r.lead_time_days ?? 28;
                  const isRisk =
                    r.is_stock_below_lead_time ??
                    r.is_stock_below_28_days ??
                    r.estimated_stock_days < safeDays;
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
                      <td>
                        {cov} / {safeDays} hari
                      </td>
                      <td>
                        <strong>{isRisk ? "Berisiko" : "Aman"}</strong>
                        {isRisk ? (
                          <>
                            <br />
                            Stok cukup {cov} hari, batas aman {safeDays} hari.
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
