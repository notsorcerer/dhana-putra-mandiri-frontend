"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, BadgeCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Field } from "@/components/app/field";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { dateId, dateTimeId, num, qty, rupiah } from "@/lib/format";
import { CAN, can } from "@/lib/menu";
import { useApi } from "@/lib/use-api";
import type { GoodsReceipt } from "@/types/api";

export default function GoodsReceiptDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { session } = useAuth();
  const canConfirm = can(CAN.confirmDocuments, session?.role);
  const { data: receipt, loading, error, reload } = useApi<GoodsReceipt>(`/inventory/goods-receipts/${id}/`);
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await apiPost(`/inventory/goods-receipts/${id}/confirm/`);
      toast.success("Penerimaan barang dikonfirmasi — stok dan HPP diperbarui, jurnal diposting.");
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengonfirmasi dokumen.", { duration: 8000 });
    } finally {
      setConfirming(false);
    }
  };

  if (loading && !receipt) {
    return (
      <div className="flex min-h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" /> Memuat dokumen…
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="space-y-4">
        <PageHeader title="Detail Penerimaan Barang" />
        <Alert variant="destructive">
          <AlertTitle>Gagal memuat dokumen</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" size="sm" asChild>
          <Link href="/goods-receipts">
            <ArrowLeft /> Kembali ke daftar
          </Link>
        </Button>
      </div>
    );
  }

  const showCost = receipt.transport_cost !== undefined;
  const totalItemValue = receipt.items.reduce(
    (sum, item) => sum + num(item.qty_actual) * num(item.purchase_price),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Penerimaan ${receipt.receipt_number}`}
        description={`Dokumen penerimaan barang dari ${receipt.supplier_name || "pemasok"}.`}
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/goods-receipts">
            <ArrowLeft /> Kembali
          </Link>
        </Button>
        {receipt.status === "draft" && canConfirm ? (
          <Button size="sm" onClick={handleConfirm} disabled={confirming}>
            {confirming ? <Loader2 className="animate-spin" /> : <BadgeCheck />}
            Konfirmasi Penerimaan
          </Button>
        ) : null}
      </PageHeader>

      {receipt.has_quantity_discrepancy ? (
        <Alert>
          <AlertTitle>Ada selisih kuantitas</AlertTitle>
          <AlertDescription>
            Sejumlah item diterima lebih sedikit daripada dipesan. Buat debit note untuk menagihkan selisih
            ke pemasok dari halaman Debit Note.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Informasi Dokumen</CardTitle>
          <CardDescription>
            Status: <StatusBadge status={receipt.status} />
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Pemasok" value={receipt.supplier_name || "-"} />
          <Field label="Tanggal" value={dateId(receipt.receipt_date)} />
          <Field label="Referensi PO" value={receipt.po_reference || "-"} />
          <Field label="Dibuat oleh" value={`${receipt.created_by_name} · ${dateTimeId(receipt.created_at)}`} />
          {showCost ? (
            <>
              <Field label="Ongkos Transportasi" value={rupiah(receipt.transport_cost)} />
              <Field label="Ongkos Bongkar Muat" value={rupiah(receipt.unloading_cost)} />
            </>
          ) : null}
          <Field
            label="Dikonfirmasi oleh"
            value={receipt.received_by_name ? `${receipt.received_by_name} · ${dateTimeId(receipt.confirmed_at)}` : "-"}
          />
          <Field label="Catatan" value={receipt.notes || "-"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Item Diterima ({receipt.items.length})</CardTitle>
          {showCost ? (
            <CardDescription>
              Total nilai pembelian item: <span className="font-medium text-foreground">{rupiah(totalItemValue)}</span>
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>
          {receipt.items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Dokumen ini tidak memiliki item (dibuat tanpa rincian).
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead className="text-right">Dipesan</TableHead>
                    <TableHead className="text-right">Diterima</TableHead>
                    <TableHead className="text-right">Selisih</TableHead>
                    {showCost ? <TableHead className="text-right">Harga Beli</TableHead> : null}
                    {showCost ? <TableHead className="text-right">Biaya Efektif</TableHead> : null}
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipt.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">{item.product_sku}</p>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{qty(item.qty_ordered)}</TableCell>
                      <TableCell className="text-right tabular-nums">{qty(item.qty_actual)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {num(item.discrepancy_qty) < 0 ? (
                          <span className="font-medium text-destructive">{qty(item.discrepancy_qty)}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      {showCost ? (
                        <TableCell className="text-right tabular-nums">
                          {item.purchase_price !== undefined ? rupiah(item.purchase_price) : "-"}
                        </TableCell>
                      ) : null}
                      {showCost ? (
                        <TableCell className="text-right tabular-nums">
                          {item.effective_unit_cost !== undefined ? rupiah(item.effective_unit_cost) : "-"}
                        </TableCell>
                      ) : null}
                      <TableCell className="text-sm text-muted-foreground">{item.notes || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
