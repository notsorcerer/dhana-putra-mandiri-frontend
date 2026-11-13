"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { StatusBadge } from "@/components/app/status-badge";
import { fetchAllPages } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { dateId, num, qty, rupiah } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import type { Payment, SalesInvoice } from "@/types/api";

const PAYMENT_VIEWER_ROLES = ["direktur", "admin", "kasir", "accounting"];

/**
 * Halaman Detail Faktur Penjualan:
 * paritas penuh dengan templates/detail.html.
 */
export default function SalesInvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { session } = useAuth();
  const canViewPayments = session ? PAYMENT_VIEWER_ROLES.includes(session.role) : false;

  const {
    data: invoice,
    loading,
    error,
  } = useApi<SalesInvoice>(`/finance/sales-invoices/${id}/`);

  const [payments, setPayments] = useState<Payment[] | null>(null);

  useEffect(() => {
    if (!canViewPayments || !invoice) return;
    let cancelled = false;
    fetchAllPages<Payment>("/finance/payments/")
      .then((rows) => {
        if (!cancelled) {
          setPayments(rows.filter((p) => p.sales_invoice === invoice.id));
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [canViewPayments, invoice, id]);

  const linkedPayments = useMemo(
    () => (payments ?? []).filter((p) => p.sales_invoice === invoice?.id),
    [payments, invoice],
  );
  const paidFromPayments = linkedPayments.reduce((sum, p) => sum + num(p.amount), 0);
  const total = invoice ? num(invoice.total_amount) : 0;
  const remaining = Math.max(0, total - paidFromPayments);

  if (loading && !invoice) {
    return <p className="panel pad">Memuat dokumen…</p>;
  }

  if (error || !invoice) {
    return (
      <div>
        <div className="pagehead">
          <div>
            <div className="eyebrow">DOKUMEN PENJUALAN</div>
            <h1>Detail penjualan</h1>
          </div>
        </div>
        <p className="errorlist">Gagal memuat faktur — {error}</p>
        <Link className="outline" href="/sales-invoices">
          ← Kembali ke daftar
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">DOKUMEN PENJUALAN</div>
          <h1>{invoice.invoice_number}</h1>
          <p>
            {invoice.invoice_number} · {dateId(invoice.invoice_date)} ·{" "}
            {invoice.customer_name || "Internal"}
          </p>
        </div>
        <StatusBadge status={invoice.status} />
      </div>

      {invoice.delivery ? (
        <p>
          Surat jalan terkait{" "}
          <Link href={`/deliveries/${invoice.delivery}`}>#{invoice.delivery}</Link>
        </p>
      ) : null}
      {invoice.notes ? <p>{invoice.notes}</p> : null}
      <p>
        {invoice.invoice_date === invoice.due_date ? "Tunai" : "Tempo"} · Jatuh tempo{" "}
        {dateId(invoice.due_date)}
      </p>

      <section className="panel scroll">
        <table>
          <thead>
            <tr>
              <th>Produk</th>
              <th>Jumlah</th>
              <th>Harga jual</th>
              <th>Diskon</th>
              <th>Total baris</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.length === 0 ? (
              <tr>
                <td colSpan={5}>Belum ada rincian barang.</td>
              </tr>
            ) : (
              invoice.items.map((l) => (
                <tr key={l.id}>
                  <td>
                    {l.product_sku} · {l.product_name}
                  </td>
                  <td>{qty(l.qty)}</td>
                  <td>{rupiah(l.unit_price)}</td>
                  <td>{rupiah(l.discount_amount)}</td>
                  <td>{rupiah(l.line_total)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="totals">
          <div>
            <span>Subtotal</span>
            <strong>{rupiah(invoice.subtotal)}</strong>
          </div>
          <div>
            <span>Diskon</span>
            <strong>{rupiah(invoice.discount_amount)}</strong>
          </div>
          <div className="grand">
            <span>Total</span>
            <strong>{rupiah(invoice.total_amount)}</strong>
          </div>
        </div>
      </section>

      {invoice.delivery ? (
        <p>
          <Link className="button" href={`/deliveries/${invoice.delivery}`}>
            Buka surat jalan
          </Link>
        </p>
      ) : null}

      {canViewPayments && linkedPayments.length > 0 ? (
        <section className="panel scroll accounting">
          <div className="panelhead">
            <div>
              <h2>Mutasi pembayaran</h2>
              <p>
                Terbayar {rupiah(paidFromPayments)} · Sisa tagihan {rupiah(remaining)}
              </p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Dokumen</th>
                <th>Tanggal</th>
                <th>Akun</th>
                <th>Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {linkedPayments.map((p) => (
                <tr key={p.id}>
                  <td className="doc-number">{p.payment_number}</td>
                  <td>{dateId(p.payment_date)}</td>
                  <td>
                    {p.cash_bank_account_code} · {p.cash_bank_account_name}
                  </td>
                  <td>{rupiah(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
}
