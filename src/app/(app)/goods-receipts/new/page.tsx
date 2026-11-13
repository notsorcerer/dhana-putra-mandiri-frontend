"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  GoodsReceiptItemsEditor,
  type GrItemDraft,
  emptyGrItem,
} from "@/components/app/items-editor";
import { ApiError, fetchAllPages } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { postDocumentWithItems } from "@/lib/doc-submit";
import { suggestDocNumber, todayIso } from "@/lib/format";
import { CAN, can } from "@/lib/menu";
import type { GoodsReceipt, Product, Supplier } from "@/types/api";

export default function NewGoodsReceiptPage() {
  const router = useRouter();
  const { session } = useAuth();
  const showCost = session?.role !== "gudang";
  const canCreate = can(CAN.createGoodsReceipt, session?.role);

  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    receipt_number: suggestDocNumber("GR"),
    supplier: "",
    supplier_name: "",
    payment_method: "credit",
    receipt_date: todayIso(),
    due_date: "",
    transport_cost: "0",
    unloading_cost: "0",
    notes: "",
  });
  const [items, setItems] = useState<GrItemDraft[]>([emptyGrItem()]);

  useEffect(() => {
    fetchAllPages<Product>("/inventory/products/")
      .then(setProducts)
      .catch(() => toast.error("Gagal memuat daftar produk."));
    fetchAllPages<Supplier>("/finance/suppliers/")
      .then(setSuppliers)
      .catch(() => undefined);
  }, []);

  const set = <K extends keyof typeof form>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSupplierChange = (val: string) => {
    const found = suppliers.find((s) => String(s.id) === val);
    if (found) {
      setForm((prev) => ({
        ...prev,
        supplier: String(found.id),
        supplier_name: found.name,
      }));
    } else {
      setForm((prev) => ({ ...prev, supplier: "", supplier_name: val }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        receipt_number: form.receipt_number,
        ...(form.supplier !== "" ? { supplier: Number(form.supplier) } : {}),
        supplier_name: form.supplier_name,
        payment_method: form.payment_method,
        receipt_date: form.receipt_date,
        ...(form.due_date !== "" ? { due_date: form.due_date } : {}),
        notes: form.notes,
        items: items
          .filter((item) => item.product !== "" && item.qty_ordered !== "")
          .map((item) => ({
            product: item.product,
            qty_ordered: item.qty_ordered,
            qty_actual: item.qty_actual === "" ? item.qty_ordered : item.qty_actual,
            ...(showCost && item.purchase_price !== ""
              ? { purchase_price: item.purchase_price }
              : {}),
            notes: item.notes,
          })),
      };
      if (showCost) {
        payload.transport_cost = form.transport_cost === "" ? "0.00" : form.transport_cost;
        payload.unloading_cost = form.unloading_cost === "" ? "0.00" : form.unloading_cost;
      }

      const { data, degraded } = await postDocumentWithItems<GoodsReceipt>(
        "/inventory/goods-receipts/",
        payload,
      );

      if (degraded) {
        toast.warning(
          "Dokumen tersimpan sebagai draf tanpa item (keterbatasan backend saat menyimpan item sekaligus).",
          { duration: 8000 },
        );
      } else {
        toast.success(`Draf ${data.receipt_number} tersimpan.`);
      }
      router.push(`/goods-receipts/${data.id}`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Gagal menyimpan dokumen.";
      toast.error(message, { duration: 8000 });
    } finally {
      setSaving(false);
    }
  };

  if (!canCreate) {
    return (
      <div>
        <h1>Buat penerimaan</h1>
        <p className="empty-state panel">
          Peran Anda tidak berhak membuat dokumen penerimaan barang.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>Buat penerimaan</h1>
      <form className="panel formgrid" id="draft-form" onSubmit={handleSubmit}>
        <label>
          Tanggal dokumen
          <input
            type="date"
            name="day"
            value={form.receipt_date}
            onChange={(e) => set("receipt_date", e.target.value)}
            required
          />
        </label>
        <label>
          Mitra
          {suppliers.length > 0 ? (
            <select
              name="party"
              value={form.supplier}
              onChange={(e) => handleSupplierChange(e.target.value)}
              required
            >
              <option value="">Pilih mitra</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              name="party"
              value={form.supplier_name}
              onChange={(e) => set("supplier_name", e.target.value)}
              placeholder="Nama pemasok"
              required
            />
          )}
        </label>
        <label>
          Nomor penerimaan
          <input
            value={form.receipt_number}
            onChange={(e) => set("receipt_number", e.target.value)}
            required
          />
        </label>
        <label>
          Metode pembayaran
          <select
            value={form.payment_method}
            onChange={(e) => set("payment_method", e.target.value)}
          >
            <option value="credit">Tempo / Kredit</option>
            <option value="cash">Tunai</option>
          </select>
        </label>
        {form.payment_method === "credit" ? (
          <label>
            Jatuh tempo hutang
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => set("due_date", e.target.value)}
            />
          </label>
        ) : null}
        {showCost ? (
          <>
            <label>
              Transport pada bukti (Rp)
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.transport_cost}
                onChange={(e) => set("transport_cost", e.target.value)}
              />
            </label>
            <label>
              Bongkar pada bukti (Rp)
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.unloading_cost}
                onChange={(e) => set("unloading_cost", e.target.value)}
              />
            </label>
          </>
        ) : null}

        <GoodsReceiptItemsEditor
          rows={items}
          onChange={setItems}
          products={products}
          showCost={showCost}
        />

        <label className="wide">
          Catatan / alasan
          <textarea
            name="note"
            maxLength={400}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </label>

        <div className="wide draft-impact">
          Draf disimpan untuk diperiksa. Stok diperbarui setelah dokumen dibukukan.
        </div>

        <div>
          <button type="submit" disabled={saving}>
            {saving ? "Menyimpan…" : "Simpan draf"}
          </button>
        </div>
      </form>
    </div>
  );
}
