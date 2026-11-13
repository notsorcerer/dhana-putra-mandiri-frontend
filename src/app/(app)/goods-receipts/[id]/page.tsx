"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { StatusBadge } from "@/components/app/status-badge";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { dateId, num, qty, rupiah, todayIso } from "@/lib/format";
import { CAN, can } from "@/lib/menu";
import { useApi } from "@/lib/use-api";
import type { GoodsReceipt } from "@/types/api";

export default function GoodsReceiptDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { session } = useAuth();
  const canConfirm = can(CAN.confirmDocuments, session?.role);
  const {
    data: receipt,
    loading,
    error,
    reload,
  } = useApi<GoodsReceipt>(`/inventory/goods-receipts/${id}/`);
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirming(true);
    try {
      await apiPost(`/inventory/goods-receipts/${id}/confirm/`);
      toast.success(`Status dokumen ${receipt?.receipt_number ?? ""} diperbarui.`);
      reload();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal mengonfirmasi dokumen.",
        { duration: 8000 },
      );
    } finally {
      setConfirming(false);
    }
  };

  if (loading && !receipt) {
    return <p className="panel pad">Memuat dokumen…</p>;
  }

  if (error || !receipt) {
    return (
      <div>
        <div className="pagehead">
          <div>
            <div className="eyebrow">DOKUMEN PENERIMAAN</div>
            <h1>Detail penerimaan</h1>
          </div>
        </div>
        <p className="errorlist">Gagal memuat dokumen — {error}</p>
        <Link className="outline" href="/goods-receipts">
          ← Kembali ke daftar
        </Link>
      </div>
    );
  }

  const showCost = receipt.transport_cost !== undefined;

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">DOKUMEN PENERIMAAN</div>
          <h1>{receipt.receipt_number}</h1>
          <p>
            {receipt.receipt_number} · {dateId(receipt.receipt_date)} ·{" "}
            {receipt.supplier_name || "Internal"}
          </p>
        </div>
        <StatusBadge status={receipt.status} />
      </div>

      {receipt.po_reference ? <p>Referensi PO {receipt.po_reference}</p> : null}
      {receipt.notes ? <p>{receipt.notes}</p> : null}
      {receipt.has_quantity_discrepancy ? (
        <p className="errorlist">
          Ada selisih kuantitas antara barang dipesan dan diterima.
        </p>
      ) : null}

      <section className="panel scroll">
        <table>
          <thead>
            <tr>
              <th>Produk</th>
              <th>Dipesan</th>
              <th>Jumlah diterima</th>
              {showCost ? <th>Harga beli</th> : null}
              {showCost ? <th>Harga pokok baris</th> : null}
            </tr>
          </thead>
          <tbody>
            {receipt.items.length === 0 ? (
              <tr>
                <td colSpan={showCost ? 5 : 3}>Belum ada rincian barang.</td>
              </tr>
            ) : (
              receipt.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.product_sku} · {item.product_name}
                  </td>
                  <td>{qty(item.qty_ordered)}</td>
                  <td>{qty(item.qty_actual)}</td>
                  {showCost ? (
                    <td>
                      {item.purchase_price !== undefined
                        ? rupiah(item.purchase_price)
                        : "—"}
                    </td>
                  ) : null}
                  {showCost ? (
                    <td>
                      {item.effective_unit_cost !== undefined
                        ? rupiah(num(item.qty_actual) * num(item.effective_unit_cost))
                        : "—"}
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {receipt.status === "draft" && canConfirm ? (
        <form onSubmit={handleConfirm} className="panel formgrid">
          <h2 className="wide">Verifikasi dan bukukan</h2>
          <label>
            Tanggal efektif
            <input type="date" name="day" defaultValue={todayIso()} required />
          </label>
          <label>
            Nomor bukti
            <input
              name="proof"
              defaultValue={receipt.po_reference || receipt.receipt_number}
              maxLength={80}
            />
          </label>
          <div className="wide">
            <button type="submit" disabled={confirming}>
              {confirming ? "Memproses…" : "Bukukan penerimaan"}
            </button>
          </div>
        </form>
      ) : null}

      {showCost && receipt.status === "confirmed" ? (
        <section className="panel pad">
          <h2>Perolehan persediaan</h2>
          <p>
            Transport {rupiah(receipt.transport_cost)} · Bongkar{" "}
            {rupiah(receipt.unloading_cost)}
            {receipt.payable_amount !== undefined
              ? ` · Tagihan pemasok ${rupiah(receipt.payable_amount)}`
              : ""}
            {receipt.net_payable !== undefined
              ? ` · Sisa hutang bersih ${rupiah(receipt.net_payable)}`
              : ""}
          </p>
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Harga beli per unit</th>
                  <th>Biaya efektif per unit</th>
                  <th>Selisih kuantitas</th>
                </tr>
              </thead>
              <tbody>
                {receipt.items.map((l) => (
                  <tr key={l.id}>
                    <td>{l.product_sku}</td>
                    <td>{rupiah(l.purchase_price)}</td>
                    <td>{rupiah(l.effective_unit_cost)}</td>
                    <td>{qty(l.discrepancy_qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
