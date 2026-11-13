"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  InvoiceItemsEditor,
  type InvoiceItemDraft,
  emptyInvoiceItem,
  invoiceDraftSubtotal,
} from "@/components/app/items-editor";
import { ApiError, fetchAllPages } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { postDocumentWithItems } from "@/lib/doc-submit";
import { rupiah, suggestDocNumber, todayIso } from "@/lib/format";
import { CAN, can } from "@/lib/menu";
import type { Customer, Delivery, Product, SalesInvoice } from "@/types/api";

function isoPlusDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export default function NewSalesInvoicePage() {
  const router = useRouter();
  const { session } = useAuth();
  const canCreate = can(CAN.createInvoice, session?.role);

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    invoice_number: suggestDocNumber("INV"),
    customer_name: "",
    delivery: "",
    terms: "Tempo",
    invoice_date: todayIso(),
    due_date: isoPlusDays(30),
    notes: "",
  });
  const [items, setItems] = useState<InvoiceItemDraft[]>([emptyInvoiceItem()]);

  useEffect(() => {
    fetchAllPages<Product>("/inventory/products/")
      .then(setProducts)
      .catch(() => toast.error("Gagal memuat daftar produk."));
    fetchAllPages<Customer>("/finance/customers/")
      .then(setCustomers)
      .catch(() => undefined);
    fetchAllPages<Delivery>("/inventory/deliveries/")
      .then(setDeliveries)
      .catch(() => undefined);
  }, []);

  const set = <K extends keyof typeof form>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const subtotal = invoiceDraftSubtotal(items);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        invoice_number: form.invoice_number,
        customer_name: form.customer_name,
        invoice_date: form.invoice_date,
        due_date: form.terms === "Tunai" ? form.invoice_date : form.due_date,
        notes: form.notes,
        ...(form.delivery !== "" ? { delivery: Number(form.delivery) } : {}),
        items: items
          .filter((item) => item.product !== "" && item.qty !== "")
          .map((item) => ({
            product: item.product,
            qty: item.qty,
            unit_price: item.unit_price,
            discount_amount:
              item.discount_amount === "" ? "0.00" : item.discount_amount,
          })),
      };

      const { data, degraded } = await postDocumentWithItems<SalesInvoice>(
        "/finance/sales-invoices/",
        payload,
      );

      if (degraded) {
        toast.warning(
          "Faktur tersimpan sebagai draf tanpa item (keterbatasan backend saat menyimpan item sekaligus).",
          { duration: 8000 },
        );
      } else {
        toast.success(`Draf ${data.invoice_number} tersimpan.`);
      }
      router.push(`/sales-invoices/${data.id}`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Gagal menyimpan faktur.";
      toast.error(message, { duration: 8000 });
    } finally {
      setSaving(false);
    }
  };

  if (!canCreate) {
    return (
      <div>
        <h1>Buat penjualan</h1>
        <p className="empty-state panel">
          Peran Anda tidak berhak membuat faktur penjualan.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>Buat penjualan</h1>
      <form className="panel formgrid" id="draft-form" onSubmit={handleSubmit}>
        <label>
          Tanggal dokumen
          <input
            type="date"
            name="day"
            value={form.invoice_date}
            onChange={(e) => set("invoice_date", e.target.value)}
            required
          />
        </label>
        <label>
          Mitra
          {customers.length > 0 ? (
            <select
              name="party"
              value={form.customer_name}
              onChange={(e) => set("customer_name", e.target.value)}
              required
            >
              <option value="">Pilih mitra</option>
              {customers.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              name="party"
              value={form.customer_name}
              onChange={(e) => set("customer_name", e.target.value)}
              placeholder="Nama pelanggan"
              required
            />
          )}
        </label>
        <label>
          Syarat pembayaran
          <select
            name="terms"
            value={form.terms}
            onChange={(e) => set("terms", e.target.value)}
          >
            <option value="Tempo">Tempo</option>
            <option value="Tunai">Tunai</option>
          </select>
        </label>
        <label>
          Jatuh tempo
          <input
            type="date"
            name="due"
            value={form.terms === "Tunai" ? form.invoice_date : form.due_date}
            onChange={(e) => set("due_date", e.target.value)}
          />
        </label>
        <label>
          Nomor faktur
          <input
            value={form.invoice_number}
            onChange={(e) => set("invoice_number", e.target.value)}
            required
          />
        </label>
        <label>
          Surat jalan terkait
          <select
            value={form.delivery}
            onChange={(e) => set("delivery", e.target.value)}
          >
            <option value="">Pilih surat jalan (opsional)</option>
            {deliveries.map((d) => (
              <option key={d.id} value={d.id}>
                {d.delivery_number} · {d.customer_name || "Internal"}
              </option>
            ))}
          </select>
        </label>

        <InvoiceItemsEditor rows={items} onChange={setItems} products={products} />

        <label className="wide">
          Catatan / alasan
          <textarea
            name="note"
            maxLength={400}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </label>

        <div className="draft-total wide">
          <span>Total draf</span>
          <strong id="draft-total">{subtotal > 0 ? rupiah(subtotal) : "—"}</strong>
        </div>

        <div className="wide draft-impact">
          Draf disimpan untuk diperiksa. Stok, HPP, dan tagihan dibukukan saat penyerahan
          dikonfirmasi.
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
