"use client";

import { useEffect, useMemo, useState } from "react";
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
import { InvoiceItemsEditor, type InvoiceItemDraft, emptyInvoiceItem } from "@/components/app/items-editor";
import { ApiError, fetchAllPages } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { postDocumentWithItems } from "@/lib/doc-submit";
import { suggestDocNumber, todayIso } from "@/lib/format";
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
    // Surat jalan terkonfirmasi sebagai referensi pengiriman (opsional).
    fetchAllPages<Delivery>("/inventory/deliveries/")
      .then(setDeliveries)
      .catch(() => undefined);
  }, []);

  const set = <K extends keyof typeof form>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const handleProductPick = (productId: number) => {
    const product = productMap.get(productId);
    if (!product) return;
    // Isi harga jual otomatis bila kosong (peran Sales/Gudang mungkin tidak
    // menerima selling_price dari serializer).
    setItems((prev) =>
      prev.map((row) => {
        const isLastEdited = row.product === productId && row.unit_price === "";
        if (!isLastEdited) return row;
        return { ...row, unit_price: product.selling_price ?? row.unit_price };
      }),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        invoice_number: form.invoice_number,
        customer_name: form.customer_name,
        invoice_date: form.invoice_date,
        due_date: form.due_date,
        notes: form.notes,
        ...(form.delivery !== "" ? { delivery: Number(form.delivery) } : {}),
        items: items
          .filter((item) => item.product !== "" && item.qty !== "")
          .map((item) => ({
            product: item.product,
            qty: item.qty,
            unit_price: item.unit_price,
            discount_amount: item.discount_amount === "" ? "0.00" : item.discount_amount,
          })),
      };

      const { data, degraded } = await postDocumentWithItems<SalesInvoice>(
        "/finance/sales-invoices/",
        payload,
      );

      if (degraded) {
        toast.warning(
          "Faktur tersimpan TANPA item — backend mengalami bug saat menyimpan item sekaligus dokumen (lihat README).",
          { duration: 9000 },
        );
      } else {
        toast.success(`Faktur ${data.invoice_number} berhasil dibuat (draft).`);
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
        <PageHeader title="Buat Faktur Penjualan" />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Peran Anda tidak berhak membuat faktur penjualan.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Buat Faktur Penjualan"
        description="Faktur tersimpan sebagai draft. Status berubah menjadi unpaid setelah ada item dan diproses."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/sales-invoices">
            <ArrowLeft /> Kembali
          </Link>
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Faktur</CardTitle>
            <CardDescription>Nomor faktur wajib diisi dan harus unik.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="invoice_number">Nomor Faktur *</Label>
              <Input id="invoice_number" required value={form.invoice_number} onChange={(e) => set("invoice_number", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invoice_date">Tanggal Faktur *</Label>
              <Input id="invoice_date" type="date" required value={form.invoice_date} onChange={(e) => set("invoice_date", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="due_date">Jatuh Tempo *</Label>
              <Input id="due_date" type="date" required value={form.due_date} onChange={(e) => set("due_date", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer_name">Nama Pelanggan *</Label>
              <Input
                id="customer_name"
                required
                list="invoice-customer-options"
                value={form.customer_name}
                onChange={(e) => set("customer_name", e.target.value)}
                placeholder="Toko Berkah Minyak"
              />
              <datalist id="invoice-customer-options">
                {customers.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="delivery">Surat Jalan Terkait</Label>
              <select
                id="delivery"
                value={form.delivery}
                onChange={(e) => set("delivery", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="">— tidak terkait —</option>
                {deliveries.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.delivery_number} · {d.customer_name || "tanpa pelanggan"} ({d.status})
                  </option>
                ))}
              </select>
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
              Harga jual terisi otomatis dari master produk saat produk dipilih (bila tersedia untuk peran Anda).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InvoiceItemsEditor rows={items} onChange={setItems} products={products} onProductPick={handleProductPick} />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-muted-foreground">
            Simpan dengan item sesuai kontrak API; bila backend menolak (bug 500), dokumen otomatis disimpan
            tanpa item.
          </span>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            Simpan Faktur
          </Button>
        </div>
      </form>
    </div>
  );
}
