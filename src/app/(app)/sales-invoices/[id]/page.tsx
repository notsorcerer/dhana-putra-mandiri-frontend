"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { StatusBadge } from "@/components/app/status-badge";
import { ApiError, apiPost, fetchAllPages } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { dateId, num, qty, rupiah } from "@/lib/format";
import { CAN, can } from "@/lib/menu";
import { useApi } from "@/lib/use-api";
import type { Payment, SalesInvoice } from "@/types/api";

const PAYMENT_VIEWER_ROLES = ["direktur", "admin", "kasir", "accounting"];

/**
 * Halaman Detail Faktur Penjualan:
 * paritas penuh dengan templates/detail.html + dukungan revisi nilai faktur.
 */
export default function SalesInvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { session } = useAuth();
  const canViewPayments = session ? PAYMENT_VIEWER_ROLES.includes(session.role) : false;
  const canRevise = can(CAN.reviseInvoice, session?.role);

  const {
    data: invoice,
    loading,
    error,
    reload,
  } = useApi<SalesInvoice>(`/finance/sales-invoices/${id}/`);

  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [newSubtotal, setNewSubtotal] = useState("");
  const [reviseReason, setReviseReason] = useState("");
  const [revising, setRevising] = useState(false);

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
  const remaining =
    invoice?.remaining_due !== undefined
      ? num(invoice.remaining_due)
      : Math.max(0, total - paidFromPayments);

  const handleRevise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;
    setRevising(true);
    try {
      await apiPost(`/finance/sales-invoices/${invoice.id}/revise/`, {
        new_subtotal: newSubtotal,
        reason: reviseReason,
      });
      toast.success(`Faktur ${invoice.invoice_number} berhasil direvisi.`);
      setNewSubtotal("");
      setReviseReason("");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal merevisi faktur.");
    } finally {
      setRevising(false);
    }
  };

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
              invoice.items.map((l) => {
                const orderedQty = l.qty_ordered ?? l.qty ?? "0";
                const billedQty = l.effective_billed_qty ?? orderedQty;
                return (
                  <tr key={l.id}>
                    <td>
                      {l.product_sku} · {l.product_name}
                    </td>
                    <td>
                      {qty(billedQty)}
                      {num(billedQty) !== num(orderedQty) ? (
                        <small style={{ display: "block", color: "var(--muted)" }}>
                          Dipesan: {qty(orderedQty)}
                        </small>
                      ) : null}
                    </td>
                    <td>{rupiah(l.unit_price)}</td>
                    <td>{rupiah(l.discount_amount)}</td>
                    <td>{rupiah(l.line_total)}</td>
                  </tr>
                );
              })
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

      {canRevise &&
      (invoice.status === "approved" || invoice.status === "partially_paid") ? (
        <form onSubmit={handleRevise} className="panel formgrid">
          <h2 className="wide">Revisi Nilai Faktur</h2>
          <label>
            Subtotal baru (Rp)
            <input
              type="number"
              min="0"
              step="any"
              value={newSubtotal}
              onChange={(e) => setNewSubtotal(e.target.value)}
              placeholder={invoice.subtotal}
              required
            />
          </label>
          <label>
            Alasan revisi
            <input
              value={reviseReason}
              onChange={(e) => setReviseReason(e.target.value)}
              placeholder="Contoh: Selisih barang / penyesuaian harga"
              required
            />
          </label>
          <div className="wide">
            <button type="submit" disabled={revising}>
              {revising ? "Memproses…" : "Simpan revisi faktur"}
            </button>
          </div>
        </form>
      ) : null}

      {invoice.revisions && invoice.revisions.length > 0 ? (
        <section className="panel scroll">
          <div className="panelhead">
            <div>
              <h2>Riwayat Revisi Faktur</h2>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Revisi #</th>
                <th>Subtotal Lama</th>
                <th>Subtotal Baru</th>
                <th>Total Baru</th>
                <th>Alasan</th>
                <th>Oleh</th>
              </tr>
            </thead>
            <tbody>
              {invoice.revisions.map((r) => (
                <tr key={r.id}>
                  <td>#{r.revision_number}</td>
                  <td>{rupiah(r.previous_subtotal ?? r.old_total)}</td>
                  <td>{rupiah(r.new_subtotal ?? r.new_total)}</td>
                  <td>{rupiah(r.new_total)}</td>
                  <td>{r.reason}</td>
                  <td>{r.revised_by_username ?? r.revised_by_name ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
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
                    {p.cash_bank_account_code ? `${p.cash_bank_account_code} · ` : ""}
                    {p.cash_bank_name ?? p.cash_bank_account_name ?? "—"}
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
