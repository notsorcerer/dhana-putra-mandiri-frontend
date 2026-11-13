"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, Loader2, ReceiptText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Field } from "@/components/app/field";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { fetchAllPages } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { dateId, dateTimeId, num, qty, rupiah } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import type { Payment, SalesInvoice } from "@/types/api";

/** Peran dengan akses baca daftar pembayaran (mengikuti menu RBAC). */
const PAYMENT_VIEWER_ROLES = ["direktur", "admin", "kasir", "accounting"];

export default function SalesInvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { session } = useAuth();
  const canViewPayments = session ? PAYMENT_VIEWER_ROLES.includes(session.role) : false;

  const { data: invoice, loading, error } = useApi<SalesInvoice>(`/finance/sales-invoices/${id}/`);

  // Backend tidak memperbarui paid_amount saat pembayaran dibuat, sehingga
  // total terbayar dihitung client-side dari pembayaran terkait.
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);

  useEffect(() => {
    if (!canViewPayments || !invoice) return;
    let cancelled = false;
    fetchAllPages<Payment>("/finance/payments/")
      .then((rows) => {
        if (!cancelled) setPayments(rows.filter((p) => p.sales_invoice === invoice.id));
      })
      .catch((err: unknown) => {
        if (!cancelled) setPaymentsError(err instanceof Error ? err.message : "Gagal memuat pembayaran.");
      });
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
    return (
      <div className="flex min-h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" /> Memuat faktur…
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-4">
        <PageHeader title="Detail Faktur Penjualan" />
        <Alert variant="destructive">
          <AlertTitle>Gagal memuat faktur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" size="sm" asChild>
          <Link href="/sales-invoices">
            <ArrowLeft /> Kembali ke daftar
          </Link>
        </Button>
      </div>
    );
  }

  const overdue = invoice.status !== "paid" && invoice.status !== "cancelled" && new Date(invoice.due_date) < new Date();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Faktur ${invoice.invoice_number}`}
        description={`Faktur penjualan untuk ${invoice.customer_name || "pelanggan"}.`}
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/sales-invoices">
            <ArrowLeft /> Kembali
          </Link>
        </Button>
      </PageHeader>

      {overdue ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Faktur melewati jatuh tempo</AlertTitle>
          <AlertDescription>Jatuh tempo {dateId(invoice.due_date)} — piutang ini sudah lewat tanggal pembayaran.</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Informasi Faktur</CardTitle>
          <CardDescription>
            Status: <StatusBadge status={invoice.status} />
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Pelanggan" value={invoice.customer_name || "-"} />
          <Field label="Tanggal Faktur" value={dateId(invoice.invoice_date)} />
          <Field label="Jatuh Tempo" value={dateId(invoice.due_date)} />
          {invoice.delivery ? (
            <Field
              label="Surat Jalan"
              value={
                <Link href={`/deliveries/${invoice.delivery}`} className="text-primary underline-offset-4 hover:underline">
                  Lihat dokumen #{invoice.delivery}
                </Link>
              }
            />
          ) : null}
          <Field label="Dibuat oleh" value={`${invoice.created_by_name || "-"} · ${dateTimeId(invoice.created_at)}`} />
          <Field label="Catatan" value={invoice.notes || "-"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rincian Item ({invoice.items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {invoice.items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Faktur ini tidak memiliki item (dibuat tanpa rincian).
            </p>
          ) : (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      <TableHead className="text-right">Harga / unit</TableHead>
                      <TableHead className="text-right">Diskon</TableHead>
                      <TableHead className="text-right">Total Baris</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">{item.product_sku}</p>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{qty(item.qty)}</TableCell>
                        <TableCell className="text-right tabular-nums">{rupiah(item.unit_price)}</TableCell>
                        <TableCell className="text-right tabular-nums">{rupiah(item.discount_amount)}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{rupiah(item.line_total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="grid gap-2 sm:grid-cols-3 sm:justify-items-end">
                <p className="text-sm text-muted-foreground">
                  Subtotal: <span className="font-medium text-foreground">{rupiah(invoice.subtotal)}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Diskon: <span className="font-medium text-foreground">{rupiah(invoice.discount_amount)}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Total: <span className="text-base font-semibold text-foreground">{rupiah(invoice.total_amount)}</span>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {canViewPayments ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReceiptText className="size-5 text-primary" />
              Pembayaran Terkait ({linkedPayments.length})
            </CardTitle>
            <CardDescription>
              Total terbayar dihitung dari pembayaran (BKM) yang menautkan faktur ini — backend belum
              memperbarui kolom <code>paid_amount</code> secara otomatis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paymentsError ? (
              <p className="py-4 text-center text-sm text-destructive">{paymentsError}</p>
            ) : payments === null ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Memuat pembayaran…</p>
            ) : linkedPayments.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Belum ada pembayaran terkait faktur ini.
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nomor BKM/BKK</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Akun</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linkedPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.payment_number}</TableCell>
                        <TableCell>{dateId(payment.payment_date)}</TableCell>
                        <TableCell>
                          <StatusBadge status={payment.payment_type} />
                        </TableCell>
                        <TableCell className="text-sm">
                          {payment.cash_bank_account_code} · {payment.cash_bank_account_name}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{rupiah(payment.amount)}</TableCell>
                        <TableCell>
                          <StatusBadge status={payment.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="mt-4 grid gap-2 sm:grid-cols-3 sm:justify-items-end">
              <p className="text-sm text-muted-foreground">
                Terbayar (dihitung): <span className="font-medium text-foreground">{rupiah(paidFromPayments)}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Sisa (dihitung): <span className="font-medium text-foreground">{rupiah(remaining)}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Kolom backend: <span className="font-medium text-foreground">{rupiah(invoice.paid_amount)}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
