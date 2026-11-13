"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DeliveryItemsEditor,
  type DeliveryItemDraft,
  emptyDeliveryItem,
} from "@/components/app/items-editor";
import { ApiError, fetchAllPages } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { postDocumentWithItems } from "@/lib/doc-submit";
import { suggestDocNumber, todayIso } from "@/lib/format";
import { CAN, can } from "@/lib/menu";
import type { Customer, Delivery, Product } from "@/types/api";

export default function NewDeliveryPage() {
  const router = useRouter();
  const { session } = useAuth();
  const canCreate = can(CAN.createDelivery, session?.role);

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    delivery_number: suggestDocNumber("SJ"),
    customer_name: "",
    delivery_date: todayIso(),
    driver_name: "",
    vehicle_number: "",
    sales_order_ref: "",
    notes: "",
  });
  const [items, setItems] = useState<DeliveryItemDraft[]>([emptyDeliveryItem()]);

  useEffect(() => {
    fetchAllPages<Product>("/inventory/products/")
      .then(setProducts)
      .catch(() => toast.error("Gagal memuat daftar produk."));
    fetchAllPages<Customer>("/finance/customers/")
      .then(setCustomers)
      .catch(() => undefined);
  }, []);

  const set = <K extends keyof typeof form>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        delivery_number: form.delivery_number,
        customer_name: form.customer_name,
        delivery_date: form.delivery_date,
        driver_name: form.driver_name,
        vehicle_number: form.vehicle_number,
        sales_order_ref: form.sales_order_ref,
        notes: form.notes,
        items: items
          .filter((item) => item.product !== "" && item.qty !== "")
          .map((item) => ({
            product: item.product,
            qty: item.qty,
            qty_delivered: item.qty_delivered === "" ? item.qty : item.qty_delivered,
          })),
      };

      const { data, degraded } = await postDocumentWithItems<Delivery>(
        "/inventory/deliveries/",
        payload,
      );

      if (degraded) {
        toast.warning(
          "Surat jalan tersimpan sebagai draf tanpa item (keterbatasan backend saat menyimpan item sekaligus).",
          { duration: 8000 },
        );
      } else {
        toast.success(`Draf ${data.delivery_number} tersimpan.`);
      }
      router.push(`/deliveries/${data.id}`);
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
        <h1>Buat pengiriman</h1>
        <p className="empty-state panel">Peran Anda tidak berhak membuat surat jalan.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Buat pengiriman</h1>
      <form className="panel formgrid" id="draft-form" onSubmit={handleSubmit}>
        <label>
          Tanggal dokumen
          <input
            type="date"
            name="day"
            value={form.delivery_date}
            onChange={(e) => set("delivery_date", e.target.value)}
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
          Nomor surat jalan
          <input
            value={form.delivery_number}
            onChange={(e) => set("delivery_number", e.target.value)}
            required
          />
        </label>
        <label>
          Referensi pesanan (SO)
          <input
            value={form.sales_order_ref}
            onChange={(e) => set("sales_order_ref", e.target.value)}
            placeholder="Opsional"
          />
        </label>
        <label>
          Pengemudi
          <input
            value={form.driver_name}
            onChange={(e) => set("driver_name", e.target.value)}
            placeholder="Nama pengantar"
          />
        </label>
        <label>
          Nomor kendaraan
          <input
            value={form.vehicle_number}
            onChange={(e) => set("vehicle_number", e.target.value)}
            placeholder="Nomor polisi"
          />
        </label>

        <DeliveryItemsEditor rows={items} onChange={setItems} products={products} />

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
          Draf disimpan untuk diperiksa. Stok dan HPP dibukukan saat penyerahan dikonfirmasi.
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
