"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, BadgeCheck, Loader2, Printer } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Field } from "@/components/app/field";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { dateId, dateTimeId, num, qty, rupiah } from "@/lib/format";
import { CAN, can } from "@/lib/menu";
import { useApi } from "@/lib/use-api";
import type { Delivery } from "@/types/api";

interface StockConflict {
  error: string;
  detail: string;
  sku: string;
  product_name: string;
  requested_qty: string;
  available_stock: string;
}

export default function DeliveryDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { session } = useAuth();
  const canConfirm = can(CAN.confirmDocuments, session?.role);
  const { data: delivery, loading, error, reload } = useApi<Delivery>(`/inventory/deliveries/${id}/`);
  const [confirming, setConfirming] = useState(false);
  const [conflict, setConflict] = useState<StockConflict | null>(null);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await apiPost(`/inventory/deliveries/${id}/confirm/`);
      toast.success("Surat jalan dikonfirmasi — stok dipotong dan jurnal HPP diposting.");
      setConflict(null);
      reload();
    } catch (err) {
      const detail = (err as { status?: number; data?: unknown }).status === 409;
      if (detail) {
        const body = (err as { data?: unknown }).data as StockConflict | undefined;
        if (body && typeof body === "object" && "sku" in body) {
          setConflict(body);
        } else {
          toast.error(err instanceof Error ? err.message : "Konflik stok.");
        }
      } else {
        toast.error(err instanceof Error ? err.message : "Gagal mengonfirmasi surat jalan.", { duration: 8000 });
      }
    } finally {
      setConfirming(false);
    }
  };

  if (loading && !delivery) {
    return (
      <div className="flex min-h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" /> Memuat dokumen…
      </div>
    );
  }

  if (error || !delivery) {
    return (
      <div className="space-y-4">
        <PageHeader title="Detail Surat Jalan" />
        <Alert variant="destructive">
          <AlertTitle>Gagal memuat dokumen</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" size="sm" asChild>
          <Link href="/deliveries">
            <ArrowLeft /> Kembali ke daftar
          </Link>
        </Button>
      </div>
    );
  }

  const showCost = delivery.items.some((item) => item.hpp_at_delivery !== undefined);
  const totalCogs = delivery.items.reduce((sum, item) => sum + num(item.total_cogs), 0);
  const totalQty = delivery.items.reduce((sum, item) => sum + num(item.qty_delivered), 0);

  return (
    <div className="space-y-6">
      <div className="no-print">
        <PageHeader
          title={`Surat Jalan ${delivery.delivery_number}`}
          description={`Pengiriman barang ke ${delivery.customer_name || "pelanggan"}.`}
        >
          <Button variant="outline" size="sm" asChild>
            <Link href="/deliveries">
              <ArrowLeft /> Kembali
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer /> Cetak Surat Jalan
          </Button>
          {delivery.status === "draft" && canConfirm ? (
            <Button size="sm" onClick={handleConfirm} disabled={confirming}>
              {confirming ? <Loader2 className="animate-spin" /> : <BadgeCheck />}
              Konfirmasi Pengiriman
            </Button>
          ) : null}
        </PageHeader>
      </div>

      {/* Dokumen siap cetak */}
      <Card className="print:border-0 print:shadow-none">
        <CardHeader className="print:border-b print:pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs tracking-wider text-muted-foreground uppercase">CV Dhana Putra Mandiri</p>
              <CardTitle className="text-xl">Surat Jalan (Delivery Order)</CardTitle>
              <CardDescription className="no-print">
                Status: <StatusBadge status={delivery.status} />
              </CardDescription>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold">{delivery.delivery_number}</p>
              <p className="text-muted-foreground">{dateId(delivery.delivery_date)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Pelanggan" value={delivery.customer_name || "-"} />
            <Field label="Pengemudi" value={delivery.driver_name || "-"} />
            <Field label="Kendaraan" value={delivery.vehicle_number || "-"} />
            <Field label="Referensi SO" value={delivery.sales_order_ref || "-"} />
            <Field label="Dibuat oleh" value={delivery.created_by_name || "-"} />
            <Field
              label="Dikonfirmasi oleh"
              value={delivery.confirmed_by_name ? `${delivery.confirmed_by_name} · ${dateTimeId(delivery.confirmed_at)}` : "-"}
            />
            <Field label="Catatan" value={delivery.notes || "-"} />
          </div>

          <div className="overflow-hidden rounded-lg border print:rounded-none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-right">Jumlah Pesanan</TableHead>
                  <TableHead className="text-right">Jumlah Kirim</TableHead>
                  {showCost ? <TableHead className="text-right">HPP / unit</TableHead> : null}
                  {showCost ? <TableHead className="text-right">Total HPP</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {delivery.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={showCost ? 5 : 3} className="py-6 text-center text-sm text-muted-foreground">
                      Dokumen ini tidak memiliki item (dibuat tanpa rincian).
                    </TableCell>
                  </TableRow>
                ) : (
                  delivery.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.product_sku} · per {item.product_uom}
                        </p>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{qty(item.qty)}</TableCell>
                      <TableCell className="text-right tabular-nums">{qty(item.qty_delivered)}</TableCell>
                      {showCost ? (
                        <TableCell className="text-right tabular-nums">
                          {item.hpp_at_delivery !== undefined ? rupiah(item.hpp_at_delivery) : "-"}
                        </TableCell>
                      ) : null}
                      {showCost ? (
                        <TableCell className="text-right tabular-nums">
                          {item.total_cogs !== undefined ? rupiah(item.total_cogs) : "-"}
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap justify-end gap-6 text-sm">
            <span className="text-muted-foreground">
              Total kirim: <span className="font-medium text-foreground">{qty(totalQty)}</span>
            </span>
            {showCost ? (
              <span className="text-muted-foreground">
                Total HPP: <span className="font-medium text-foreground">{rupiah(totalCogs)}</span>
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-3 gap-8 pt-10 text-center text-sm">
            <div className="border-t pt-2">Dibuat oleh</div>
            <div className="border-t pt-2">Pengirim barang</div>
            <div className="border-t pt-2">Penerima (Pelanggan)</div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog konflik stok (409) */}
      <Dialog open={conflict !== null} onOpenChange={(open) => !open && setConflict(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              Stok Tidak Cukup
            </DialogTitle>
            <DialogDescription>
              Surat jalan tidak dapat dikonfirmasi karena stok tersedia lebih kecil dari jumlah yang diminta.
            </DialogDescription>
          </DialogHeader>
          {conflict ? (
            <div className="space-y-1.5 rounded-lg border bg-muted/40 p-3 text-sm">
              <p>
                <span className="text-muted-foreground">Produk:</span> {conflict.product_name} ({conflict.sku})
              </p>
              <p>
                <span className="text-muted-foreground">Diminta:</span> {qty(conflict.requested_qty)}
              </p>
              <p>
                <span className="text-muted-foreground">Stok tersedia:</span> {qty(conflict.available_stock)}
              </p>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConflict(null)}>
              Mengerti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
