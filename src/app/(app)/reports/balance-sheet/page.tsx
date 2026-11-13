"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { SvgIcon } from "@/components/app/svg-sprites";
import { num, rupiah, todayIso } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import type { BalanceSheet } from "@/types/api";

export default function BalanceSheetPage() {
  const [asOf, setAsOf] = useState(todayIso());
  const { data, loading, error } = useApi<BalanceSheet>(`/finance/reports/balance-sheet/?as_of_date=${asOf}`);

  const renderSection = (
    title: string,
    subtitle: string,
    rows: { label: string; value: number; strong?: boolean }[],
  ) => (
    <section className="panel scroll">
      <div className="panelhead">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
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
          {rows.map((row) => (
            <tr key={row.label}>
              <td>{row.strong ? <strong>{row.label}</strong> : row.label}</td>
              <td className="text-right tabular-nums">
                {row.strong ? <strong>{rupiah(row.value)}</strong> : rupiah(row.value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );

  return (
    <div className="space-y-4">
      <form className="table-tools" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="as-of">
          Per tanggal neraca
          <Input id="as-of" type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} />
        </label>
      </form>

      {loading ? (
        <section className="panel">
          <div className="empty-state">
            <SvgIcon name="doc" />
            <p>Menyusun neraca…</p>
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
          <section className="metric-grid" aria-label="Ringkasan posisi neraca">
            <article className="metric">
              <div>
                <span>Total Aktiva</span>
                <SvgIcon name="wallet" />
              </div>
              <strong>{rupiah(data.assets.total_assets)}</strong>
              <small>Kas, piutang, dan persediaan</small>
            </article>
            <article className="metric">
              <div>
                <span>Total Kewajiban</span>
                <SvgIcon name="receipt" />
              </div>
              <strong>{rupiah(data.liabilities.total_liabilities)}</strong>
              <small>Hutang usaha, gaji, dan bongkar</small>
            </article>
            <article className="metric">
              <div>
                <span>Total Ekuitas</span>
                <SvgIcon name="layers" />
              </div>
              <strong>{rupiah(data.equity.total_equity)}</strong>
              <small>Modal disetor & laba berjalan</small>
            </article>
            <article className="metric">
              <div>
                <span>Selisih Neraca</span>
                <SvgIcon name="report" />
              </div>
              <strong>{rupiah(data.summary.difference)}</strong>
              <small className={data.summary.is_balanced ? "up" : "down"}>
                {data.summary.is_balanced ? "Neraca seimbang (D = K)" : "Neraca belum seimbang"}
              </small>
            </article>
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            {renderSection("Aktiva", "Posisi harta lancar & persediaan", [
              { label: "Kas Tunai", value: num(data.assets.kas_dan_bank.kas_tunai) },
              { label: "Bank BCA", value: num(data.assets.kas_dan_bank.bank_bca) },
              { label: "Bank Mandiri", value: num(data.assets.kas_dan_bank.bank_mandiri) },
              { label: "Subtotal Kas & Bank", value: num(data.assets.kas_dan_bank.subtotal), strong: true },
              { label: "Piutang Usaha", value: num(data.assets.piutang_usaha) },
              { label: "Persediaan Barang Dagang", value: num(data.assets.persediaan_barang_dagang) },
              { label: "Total Aktiva", value: num(data.assets.total_assets), strong: true },
            ])}
            {renderSection("Kewajiban", "Kewajiban jangka pendek", [
              { label: "Hutang Usaha Supplier", value: num(data.liabilities.hutang_usaha_supplier) },
              { label: "Hutang Gaji & Upah", value: num(data.liabilities.hutang_gaji_upah) },
              { label: "Hutang Ongkos Bongkar", value: num(data.liabilities.hutang_ongkos_bongkar) },
              { label: "Total Kewajiban", value: num(data.liabilities.total_liabilities), strong: true },
            ])}
            {renderSection("Ekuitas", "Modal dan akumulasi laba", [
              { label: "Modal Disetor", value: num(data.equity.modal_disetor) },
              { label: "Laba Ditahan", value: num(data.equity.laba_ditahan) },
              { label: "Laba Periode Berjalan", value: num(data.equity.laba_periode_berjalan) },
              { label: "Total Ekuitas", value: num(data.equity.total_equity), strong: true },
            ])}
          </div>

          <section className="panel scroll">
            <div className="panelhead">
              <div>
                <h2>Ringkasan keseimbangan neraca</h2>
                <p>Per tanggal {data.as_of_date} — total aktiva vs total kewajiban & ekuitas.</p>
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
                  <td>Total Aktiva</td>
                  <td className="text-right tabular-nums">{rupiah(data.summary.total_assets)}</td>
                </tr>
                <tr>
                  <td>Total Kewajiban & Ekuitas</td>
                  <td className="text-right tabular-nums">{rupiah(data.summary.total_liabilities_and_equity)}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Selisih</strong>
                  </td>
                  <td className="text-right tabular-nums">
                    <strong>{rupiah(data.summary.difference)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        </>
      ) : null}
    </div>
  );
}
