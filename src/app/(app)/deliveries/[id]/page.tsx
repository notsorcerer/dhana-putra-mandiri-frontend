"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { dateId, qty, todayIso } from "@/lib/format";
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

/**
 * Halaman Surat Jalan & Konfirmasi Penyerahan:
 * paritas penuh dengan templates/dispatch.html dan templates/detail.html.
 */
export default function DeliveryDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { session } = useAuth();
  const canConfirm = can(CAN.confirmDocuments, session?.role);
  const {
    data: delivery,
    loading,
    error,
    reload,
  } = useApi<Delivery>(`/inventory/deliveries/${id}/`);
  const [confirming, setConfirming] = useState(false);
  const [conflict, setConflict] = useState<StockConflict | null>(null);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirming(true);
    try {
      await apiPost(`/inventory/deliveries/${id}/confirm/`);
      toast.success(`Status dokumen ${delivery?.delivery_number ?? ""} diperbarui.`);
      setConflict(null);
      reload();
    } catch (err) {
      const isConflict = (err as { status?: number }).status === 409;
      if (isConflict) {
        const body = (err as { data?: unknown }).data as StockConflict | undefined;
        if (body && typeof body === "object" && "sku" in body) {
          setConflict(body);
        } else {
          toast.error(err instanceof Error ? err.message : "Konflik stok.");
        }
      } else {
        toast.error(
          err instanceof Error ? err.message : "Gagal mengonfirmasi surat jalan.",
          { duration: 8000 },
        );
      }
    } finally {
      setConfirming(false);
    }
  };

  if (loading && !delivery) {
    return <p className="panel pad">Memuat dokumen…</p>;
  }

  if (error || !delivery) {
    return (
      <div>
        <div className="pagehead">
          <div>
            <div className="eyebrow">CV DHANA PUTRA MANDIRI</div>
            <h1>Surat jalan</h1>
          </div>
        </div>
        <p className="errorlist">Gagal memuat dokumen — {error}</p>
        <Link className="outline" href="/deliveries">
          ← Kembali ke daftar
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">CV DHANA PUTRA MANDIRI</div>
          <h1>Surat jalan</h1>
          <p>
            {delivery.delivery_number} · {dateId(delivery.delivery_date)}
          </p>
        </div>
        <button type="button" id="print" onClick={() => window.print()}>
          Cetak surat jalan
        </button>
      </div>

      {conflict ? (
        <p className="errorlist">
          <b>Stok tidak mencukupi:</b> {conflict.product_name} ({conflict.sku}) diminta{" "}
          {qty(conflict.requested_qty)}, tersedia {qty(conflict.available_stock)}.
        </p>
      ) : null}

      <section className="panel pad">
        <p>
          Gudang asal <strong>Gudang utama</strong>
          <br />
          Penerima <strong>{delivery.customer_name || "Internal"}</strong>
          <br />
          Referensi faktur{" "}
          <strong>{delivery.sales_order_ref || delivery.delivery_number}</strong>
        </p>
        <table>
          <thead>
            <tr>
              <th>Kode</th>
              <th>Barang</th>
              <th>Jumlah diserahkan</th>
              <th>Satuan</th>
            </tr>
          </thead>
          <tbody>
            {delivery.items.length === 0 ? (
              <tr>
                <td colSpan={4}>Belum ada rincian barang.</td>
              </tr>
            ) : (
              delivery.items.map((l) => (
                <tr key={l.id}>
                  <td>{l.product_sku}</td>
                  <td>{l.product_name}</td>
                  <td>{qty(l.qty_delivered || l.qty)}</td>
                  <td>{l.product_uom}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="signatures">
          <span>Petugas gudang</span>
          <span>Pengantar</span>
          <span>Penerima</span>
        </div>
        <p>Data demo sintetis</p>
      </section>

      {delivery.status === "draft" && canConfirm ? (
        <form onSubmit={handleConfirm} className="panel formgrid">
          <h2 className="wide">Konfirmasi penyerahan</h2>
          <label>
            Tanggal efektif
            <input type="date" name="day" defaultValue={todayIso()} required />
          </label>
          {delivery.items.map((l) => (
            <label key={l.id}>
              {l.product_sku} · jumlah diserahkan
              <input
                type="number"
                min="1"
                defaultValue={l.qty_delivered || l.qty}
                readOnly
              />
            </label>
          ))}
          <div className="wide">
            <button type="submit" disabled={confirming}>
              {confirming ? "Memproses…" : "Bukukan pengiriman"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
