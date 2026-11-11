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
import { Field } from "@/components/app/field";
import { PageHeader } from "@/components/app/page-header";
import { GoodsReceiptItemsEditor, type GrItemDraft, emptyGrItem } from "@/components/app/items-editor";
import { ApiError, fetchAllPages } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { postDocumentWithItems } from "@/lib/doc-submit";
import { suggestDocNumber, todayIso } from "@/lib/format";
import { CAN, can } from "@/lib/menu";
import type { GoodsReceipt, Product, Supplier } from "@/types/api";

export default function NewGoodsReceiptPage() {
  const router = useRouter();
  const { session } = useAuth();
  const showCost = session?.role !== "gudang"; // Gudang: field biaya disembunyikan backend
  const canCreate = can(CAN.createGoodsReceipt, session?.role);

  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    receipt_number: suggestDocNumber("GR"),
    supplier_name: "",
    po_reference: "",
    receipt_date: todayIso(),
    transport_cost: "",
    unloading_cost: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        receipt_number: form.receipt_number,
        supplier_name: form.supplier_name,
        po_reference: form.po_reference,
        receipt_date: form.receipt_date,
        notes: form.notes,
        items: items
          .filter((item) => item.product !== "" && item.qty_ordered !== "")
          .map((item) => ({
            product: item.product,
            qty_ordered: item.qty_ordered,
            qty_actual: item.qty_actual === "" ? item.qty_ordered : item.qty_actual,
            ...(showCost && item.purchase_price !== "" ? { purchase_price: item.purchase_price } : {}),
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
          "Dokumen tersimpan sebagai draft TANPA item — backend mengalami bug saat menyimpan item sekaligus dokumen (lihat README). Silakan tambahkan item setelah bug diperbaiki.",
          { duration: 9000 },
        );
      } else {
        toast.success(`Penerimaan barang ${data.receipt_number} berhasil dibuat (draft).`);
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
        <PageHeader title="Buat Penerimaan Barang" />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Peran Anda tidak berhak membuat dokumen penerimaan barang.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Buat Penerimaan Barang" description="Dokumen akan tersimpan sebagai draft; konfirmasi dilakukan dari halaman detail.">
        <Button variant="outline" size="sm" asChild>
          <Link href="/goods-receipts">
            <ArrowLeft /> Kembali
          </Link>
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Dokumen</CardTitle>
            <CardDescription>Nomor dokumen wajib diisi dan harus unik.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="receipt_number">Nomor Penerimaan *</Label>
              <Input id="receipt_number" required value={form.receipt_number} onChange={(e) => set("receipt_number", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="receipt_date">Tanggal Penerimaan *</Label>
              <Input id="receipt_date" type="date" required value={form.receipt_date} onChange={(e) => set("receipt_date", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="po_reference">Referensi PO</Label>
              <Input id="po_reference" value={form.po_reference} onChange={(e) => set("po_reference", e.target.value)} placeholder="PO-2026-001" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supplier_name">Nama Pemasok *</Label>
              <Input
                id="supplier_name"
                required
                list="supplier-options"
                value={form.supplier_name}
                onChange={(e) => set("supplier_name", e.target.value)}
                placeholder="PT Salim Ivomas Pratama Tbk"
              />
              <datalist id="supplier-options">
                {suppliers.map((s) => (
                  <option key={s.id} value={s.name} />
                ))}
              </datalist>
            </div>
            {showCost ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="transport_cost">Ongkos Transportasi</Label>
                  <Input id="transport_cost" type="number" min="0" step="0.01" value={form.transport_cost} onChange={(e) => set("transport_cost", e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="unloading_cost">Ongkos Bongkar Muat</Label>
                  <Input id="unloading_cost" type="number" min="0" step="0.01" value={form.unloading_cost} onChange={(e) => set("unloading_cost", e.target.value)} placeholder="0" />
                </div>
              </>
            ) : null}
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
              Qty diterima lebih kecil dari qty dipesan akan dicatat sebagai selisih (discrepancy) untuk debit note.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GoodsReceiptItemsEditor rows={items} onChange={setItems} products={products} showCost={showCost} />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Field
            label=""
            value={
              <span className="text-xs font-normal text-muted-foreground">
                Simpan dengan item sesuai kontrak API; bila backend menolak (bug 500), dokumen otomatis
                disimpan tanpa item sebagai draft.
              </span>
            }
          />
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            Simpan Draft Penerimaan
          </Button>
        </div>
      </form>
    </div>
  );
}
