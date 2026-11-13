"use client";

import Link from "next/link";
import { SalesTrendChart } from "@/components/app/charts";
import { PeriodFilter } from "@/components/app/period-filter";
import { GradeBadge, StatusBadge } from "@/components/app/status-badge";
import { SvgIcon, type SpriteIconName } from "@/components/app/svg-sprites";
import { useAuth } from "@/lib/auth";
import { dateId, qty, rupiah } from "@/lib/format";
import { CAN, can } from "@/lib/menu";
import { useApi } from "@/lib/use-api";
import type {
  BalanceSheet,
  Delivery,
  Paginated,
  SalesInvoice,
  SalesTrendsReport,
  StockEstimationRow,
} from "@/types/api";

interface Metric {
  label: string;
  value: string;
  scope: string;
  icon: SpriteIconName;
  href: string;
}

interface AlertRow {
  icon: SpriteIconName;
  label: string;
  value: string;
  caption: string;
  href: string;
}

const TODAY_LONG = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
}).format(new Date());

export default function DashboardPage() {
  const { session } = useAuth();
  const role = session?.role;
  const showFinancial = can(CAN.viewFinancialValues, role);

  const balance = useApi<BalanceSheet>(showFinancial ? "/finance/reports/balance-sheet/" : null);
  const trends = useApi<SalesTrendsReport>(
    role === "gudang" ? null : "/finance/reports/sales-trends/",
  );
  const stock = useApi<StockEstimationRow[]>(
    role === null ? null : "/inventory/products/stock-estimation/",
  );
  const recentInvoices = useApi<Paginated<SalesInvoice>>(
    role === "gudang" ? null : "/finance/sales-invoices/?page=1",
  );
  const recentDeliveries = useApi<Paginated<Delivery>>(
    role ? "/inventory/deliveries/?page=1" : null,
  );

  const stockRows = stock.data ?? [];
  const isRowRisk = (row: StockEstimationRow) =>
    row.is_stock_below_lead_time ??
    row.is_stock_below_28_days ??
    row.estimated_stock_days < (row.lead_time_days ?? 28);
  const lowStock = stockRows.filter(isRowRisk);

  const priorities = [...stockRows]
    .sort((a, b) => {
      const aRisk = isRowRisk(a) ? 0 : 1;
      const bRisk = isRowRisk(b) ? 0 : 1;
      if (aRisk !== bRisk) return aRisk - bRisk;
      return a.abc_class.localeCompare(b.abc_class);
    })
    .slice(0, 5);

  const bs = balance.data;
  const totalSales = (trends.data?.trends ?? []).reduce(
    (sum, point) => sum + point.total_sales,
    0,
  );
  const totalGross = (trends.data?.trends ?? []).reduce(
    (sum, point) => sum + point.gross_profit,
    0,
  );

  const draftDeliveries = (recentDeliveries.data?.results ?? []).filter(
    (d) => d.status === "draft",
  ).length;
  const unpaidInvoices = (recentInvoices.data?.results ?? []).filter(
    (inv) => inv.status === "unpaid" || inv.status === "partially_paid",
  ).length;

  const metrics: Metric[] = showFinancial
    ? [
        {
          label: "Penjualan bersih",
          value: trends.data ? rupiah(totalSales) : "Memuat…",
          scope: "Periode pilihan",
          icon: "sales",
          href: "/reports/sales-trends",
        },
        {
          label: "Laba kotor",
          value: trends.data ? rupiah(totalGross) : "Memuat…",
          scope: "Periode pilihan",
          icon: "layers",
          href: "/reports/sales-trends",
        },
        {
          label: "Laba bersih",
          value: bs ? rupiah(bs.equity.laba_periode_berjalan) : "Memuat…",
          scope: "Periode pilihan",
          icon: "trend",
          href: "/reports/balance-sheet",
        },
        {
          label: "Kas & bank",
          value: bs ? rupiah(bs.assets.kas_dan_bank.subtotal) : "Memuat…",
          scope: "Posisi akhir",
          icon: "wallet",
          href: "/payments",
        },
      ]
    : [
        {
          label: "Dokumen tercatat",
          value: recentDeliveries.data
            ? qty(recentDeliveries.data.count)
            : qty(stockRows.length),
          scope: "Periode pilihan",
          icon: "doc",
          href: role === "gudang" ? "/deliveries" : "/sales-invoices",
        },
        {
          label: "Menunggu proses",
          value: qty(draftDeliveries),
          scope: "Draf periode",
          icon: "clock",
          href: "/deliveries",
        },
        {
          label: "Risiko stok",
          value: stock.data ? qty(lowStock.length) : "Memuat…",
          scope: "Produk dipantau",
          icon: "box",
          href: "/products/abc-analysis",
        },
      ];

  const alerts: AlertRow[] = [];
  if (role !== "gudang") {
    alerts.push({
      icon: "receipt",
      label: "Piutang lewat tempo",
      value: bs ? rupiah(bs.assets.piutang_usaha) : `${unpaidInvoices} faktur`,
      caption: "Tagihan belum lunas",
      href: "/reports/balance-sheet",
    });
  }
  if (role !== "sales") {
    alerts.push({
      icon: "box",
      label: "Risiko kehabisan stok",
      value: `${lowStock.length} produk`,
      caption: "Stok di bawah estimasi aman",
      href: "/products/abc-analysis",
    });
  }
  alerts.push({
    icon: "truck",
    label: "Menunggu pengiriman",
    value: `${draftDeliveries} dokumen`,
    caption: "Pesanan siap diserahkan",
    href: "/deliveries",
  });

  const prompt =
    role === "gudang"
      ? { label: "Catat penerimaan", href: "/goods-receipts/new" }
      : role === "kasir" || role === "accounting"
        ? { label: "Catat mutasi", href: "/payments/new" }
        : can(CAN.createInvoice, role)
          ? { label: "Buat faktur", href: "/sales-invoices/new" }
          : null;

  const recentDocs =
    role === "gudang"
      ? (recentDeliveries.data?.results ?? []).slice(0, 6).map((d) => ({
          id: `del-${d.id}`,
          number: d.delivery_number,
          href: `/deliveries/${d.id}`,
          date: d.delivery_date,
          kind: "Pengiriman",
          party: d.customer_name || "Internal",
          status: d.status,
        }))
      : (recentInvoices.data?.results ?? []).slice(0, 6).map((inv) => ({
          id: `inv-${inv.id}`,
          number: inv.invoice_number,
          href: `/sales-invoices/${inv.id}`,
          date: inv.invoice_date,
          kind: "Penjualan",
          party: inv.customer_name || "Internal",
          status: inv.status,
        }));

  const showChart = showFinancial && trends.data !== null && trends.data.trends.length > 0;

  return (
    <>
      <header className="pagehead overview-head">
        <div>
          <h1>Ringkasan operasional</h1>
          <p>CV Dhana Putra Mandiri</p>
        </div>
        <div className="inline-actions">
          <PeriodFilter />
          {prompt ? (
            <Link className="button" href={prompt.href}>
              + {prompt.label}
            </Link>
          ) : null}
        </div>
      </header>

      <div className="metric-grid">
        {metrics.map((metric, idx) => (
          <Link key={metric.label} className={`metric metric-${idx + 1}`} href={metric.href}>
            <div>
              <span className="metric-icon">
                <SvgIcon name={metric.icon} />
              </span>
              <span>{metric.label}</span>
              <span className="metric-open">↗</span>
            </div>
            <strong>{metric.value}</strong>
            <small>{metric.scope}</small>
          </Link>
        ))}
      </div>

      <div className="workgrid">
        {showChart ? <SalesTrendChart trends={trends.data!.trends} /> : null}

        <section className="panel actionpanel">
          <div className="panelhead">
            <div>
              <h2>Perlu ditindaklanjuti</h2>
              <p>Posisi per {TODAY_LONG}</p>
            </div>
          </div>
          {alerts.map((alert) => (
            <Link key={alert.label} className="actionrow" href={alert.href}>
              <span className={`actionicon ai-${alert.icon}`}>
                <SvgIcon name={alert.icon} />
              </span>
              <span>
                <b>{alert.label}</b>
                <small>{alert.caption}</small>
              </span>
              <strong>{alert.value}</strong>
              <span className="chev">›</span>
            </Link>
          ))}
        </section>
      </div>

      <section className="panel recent">
        <div className="panelhead">
          <div>
            <h2>Transaksi terbaru</h2>
            <p>Dokumen pada periode pilihan</p>
          </div>
          <Link
            className="outline"
            href={role === "gudang" ? "/deliveries" : "/sales-invoices"}
          >
            Semua dokumen <span>→</span>
          </Link>
        </div>
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Nomor dokumen</th>
                <th>Tanggal</th>
                <th>Jenis transaksi</th>
                <th>Mitra</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentDocs.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    Belum ada dokumen pada periode ini. Pilih periode lain untuk melihat transaksi.
                  </td>
                </tr>
              ) : (
                recentDocs.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <Link className="doc-number" href={doc.href}>
                        {doc.number}
                      </Link>
                    </td>
                    <td>{dateId(doc.date)}</td>
                    <td>{doc.kind}</td>
                    <td>{doc.party}</td>
                    <td>
                      <StatusBadge status={doc.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {priorities.length > 0 ? (
        <section className="panel">
          <div className="panelhead">
            <div>
              <h2>Prioritas pemeriksaan stok</h2>
              <p>Kelas ABC dan estimasi cakupan per produk</p>
            </div>
            <Link className="outline" href="/products/abc-analysis">
              Lihat analisis →
            </Link>
          </div>
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Prioritas</th>
                  <th>Stok</th>
                  <th>Cakupan</th>
                  <th>Risiko</th>
                </tr>
              </thead>
              <tbody>
                {priorities.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/stock-movements?product=${r.id}`}>
                        {r.brand} {r.package_size}
                      </Link>
                    </td>
                    <td>
                      <GradeBadge grade={r.abc_class} />
                    </td>
                    <td>
                      {qty(r.current_stock)} {r.uom}
                    </td>
                    <td>
                      {r.estimated_stock_days != null
                        ? `${Number(r.estimated_stock_days).toLocaleString("id-ID", {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          })} hari`
                        : "—"}
                    </td>
                    <td>{isRowRisk(r) ? "Berisiko" : "Aman"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </>
  );
}
