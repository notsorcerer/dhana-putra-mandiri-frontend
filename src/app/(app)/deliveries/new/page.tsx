"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/app/page-header";
import { DeliveryItemsEditor, type DeliveryItemDraft, emptyDeliveryItem } from "@/components/app/items-editor";
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

      const { data, degraded } = await postDocumentWithItems<Delivery>("/inventory/deliveries/", payload);

      if (degraded) {
        toast.warning(
          "Surat jalan tersimpan sebagai draft TANPA item — backend mengalami bug saat menyimpan item sekaligus dokumen (lihat README).",
          { duration: 9000 },
        );
      } else {
        toast.success(`Surat jalan ${data.delivery_number} berhasil dibuat (draft).`);
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
        <PageHeader title="Buat Surat Jalan" />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Peran Anda tidak berhak membuat surat jalan.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Buat Surat Jalan"
        description="Dokumen tersimpan sebagai draft. Konfirmasi (oleh Gudang/Direktur) akan memotong stok dan memposting jurnal."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/deliveries">
            <ArrowLeft /> Kembali
          </Link>
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pengiriman</CardTitle>
            <CardDescription>Nomor dokumen wajib diisi dan harus unik.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="delivery_number">Nomor Surat Jalan *</Label>
              <Input id="delivery_number" required value={form.delivery_number} onChange={(e) => set("delivery_number", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="delivery_date">Tanggal Kirim *</Label>
              <Input id="delivery_date" type="date" required value={form.delivery_date} onChange={(e) => set("delivery_date", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer_name">Nama Pelanggan *</Label>
              <Input
                id="customer_name"
                required
                list="customer-options"
                value={form.customer_name}
                onChange={(e) => set("customer_name", e.target.value)}
                placeholder="Toko Berkah Minyak"
              />
              <datalist id="customer-options">
                {customers.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="driver_name">Pengemudi</Label>
              <Input id="driver_name" value={form.driver_name} onChange={(e) => set("driver_name", e.target.value)} placeholder="Slamet" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vehicle_number">Nomor Kendaraan</Label>
              <Input id="vehicle_number" value={form.vehicle_number} onChange={(e) => set("vehicle_number", e.target.value)} placeholder="B 1234 XYZ" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sales_order_ref">Referensi SO</Label>
              <Input id="sales_order_ref" value={form.sales_order_ref} onChange={(e) => set("sales_order_ref", e.target.value)} placeholder="SO-2026-001" />
            </div>
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea id="notes" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rincian Item</CardTitle>
            <CardDescription>
              Stok akan diperiksa saat konfirmasi — pengiriman melebihi stok ditolak dengan konflik 409.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeliveryItemsEditor rows={items} onChange={setItems} products={products} />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-muted-foreground">
            Simpan dengan item sesuai kontrak API; bila backend menolak (bug 500), dokumen otomatis disimpan
            tanpa item sebagai draft.
          </span>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            Simpan Draft Surat Jalan
          </Button>
        </div>
      </form>
    </div>
  );
}
