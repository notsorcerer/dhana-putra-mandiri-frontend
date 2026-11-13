"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiPatch, apiPost } from "@/lib/api";
import { todayIso } from "@/lib/format";
import type { Product } from "@/types/api";

interface ProductFormValues {
  sku: string;
  name: string;
  brand: string;
  package_size: string;
  uom: string;
  base_unit: string;
  conversion_factor: string;
  selling_price: string;
  daily_consumption_rate: string;
  min_stock_level: string;
  description: string;
  is_active: boolean;
}

const EMPTY: ProductFormValues = {
  sku: "",
  name: "",
  brand: "",
  package_size: "2L",
  uom: "Karton",
  base_unit: "Liter",
  conversion_factor: "1.00",
  selling_price: "",
  daily_consumption_rate: "",
  min_stock_level: "",
  description: "",
  is_active: true,
};

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSaved: () => void;
}

/** Dialog tambah/ubah produk (hanya untuk peran dengan hak kelola produk). */
export function ProductFormDialog({ open, onOpenChange, product, onSaved }: ProductFormDialogProps) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>(EMPTY);
  const [saving, setSaving] = useState(false);
  const editing = product != null;

  useEffect(() => {
    if (open) {
      // Isi ulang form dari data produk terpilih saat dialog dibuka.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValues(
        product
          ? {
              sku: product.sku,
              name: product.name,
              brand: product.brand ?? "",
              package_size: product.package_size ?? "",
              uom: product.uom,
              base_unit: product.base_unit,
              conversion_factor: product.conversion_factor,
              selling_price: product.selling_price ?? "",
              daily_consumption_rate: product.daily_consumption_rate,
              min_stock_level: product.min_stock_level,
              description: product.description ?? "",
              is_active: product.is_active,
            }
          : EMPTY,
      );
    }
  }, [open, product]);

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await apiPatch<Product>(`/inventory/products/${product!.id}/`, values);
        toast.success(`Produk ${values.name} berhasil diperbarui.`);
      } else {
        await apiPost<Product>("/inventory/products/", values);
        toast.success(`Produk ${values.name} berhasil ditambahkan.`);
      }
      onOpenChange(false);
      onSaved();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan produk.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Ubah Produk" : "Tambah Produk"}</DialogTitle>
          <DialogDescription>
            Stok dan HPP dikelola otomatis backend melalui penerimaan barang dan pengiriman.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sku">SKU *</Label>
              <Input id="sku" required value={values.sku} onChange={(e) => set("sku", e.target.value)} disabled={editing} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Nama Produk *</Label>
              <Input id="name" required value={values.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brand">Merek</Label>
              <Input id="brand" value={values.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Bimoli" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="package_size">Ukuran Kemasan</Label>
              <Input id="package_size" value={values.package_size} onChange={(e) => set("package_size", e.target.value)} placeholder="2L" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="uom">Satuan (UoM) *</Label>
              <Input id="uom" required value={values.uom} onChange={(e) => set("uom", e.target.value)} placeholder="Karton" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="base_unit">Satuan Dasar</Label>
              <Input id="base_unit" value={values.base_unit} onChange={(e) => set("base_unit", e.target.value)} placeholder="Liter" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="conversion_factor">Faktor Konversi</Label>
              <Input
                id="conversion_factor"
                type="number"
                min="0.01"
                step="0.01"
                value={values.conversion_factor}
                onChange={(e) => set("conversion_factor", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="selling_price">Harga Jual / unit</Label>
              <Input
                id="selling_price"
                type="number"
                min="0"
                step="0.01"
                value={values.selling_price}
                onChange={(e) => set("selling_price", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="daily_consumption_rate">Konsumsi Harian</Label>
              <Input
                id="daily_consumption_rate"
                type="number"
                min="0"
                step="0.01"
                value={values.daily_consumption_rate}
                onChange={(e) => set("daily_consumption_rate", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="min_stock_level">Stok Minimum</Label>
              <Input
                id="min_stock_level"
                type="number"
                min="0"
                step="0.01"
                value={values.min_stock_level}
                onChange={(e) => set("min_stock_level", e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" rows={2} value={values.description} onChange={(e) => set("description", e.target.value)} />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="is_active" checked={values.is_active} onCheckedChange={(v) => set("is_active", v === true)} />
            <Label htmlFor="is_active" className="font-normal">
              Produk aktif
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : null}
              {editing ? "Simpan Perubahan" : "Tambah Produk"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Tanggal hari ini — dipakai placeholder input tanggal di seluruh aplikasi. */
export { todayIso };
