"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormPage } from "@/components/app/form-page";
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

function toValues(product: Product): ProductFormValues {
  return {
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
  };
}

/** Halaman tambah/ubah produk (hanya untuk peran dengan hak kelola produk). */
export function ProductForm({ product }: { product?: Product | null }) {
  const router = useRouter();
  const editing = product != null;
  const [values, setValues] = useState<ProductFormValues>(product ? toValues(product) : EMPTY);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await apiPatch<Product>(`/inventory/products/${product.id}/`, values);
        toast.success(`Produk ${values.name} berhasil diperbarui.`);
      } else {
        await apiPost<Product>("/inventory/products/", values);
        toast.success(`Produk ${values.name} berhasil ditambahkan.`);
      }
      router.push("/products");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan produk.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormPage
      eyebrow="DATA MASTER"
      title={editing ? "Ubah produk" : "Tambah produk"}
      description="Stok dan HPP dikelola otomatis backend melalui penerimaan barang dan pengiriman."
      sectionTitle="Identitas produk"
      sectionDescription="SKU wajib unik. Stok, HPP rata-rata, dan kelas ABC dihitung backend."
      backHref="/products"
      onSubmit={handleSubmit}
      saving={saving}
      submitLabel={editing ? "Simpan perubahan" : "Tambah produk"}
    >
      <label>
        SKU *
        <Input
          id="sku"
          required
          value={values.sku}
          onChange={(e) => set("sku", e.target.value)}
          disabled={editing}
          placeholder="BIM-2L"
        />
      </label>
      <label>
        Nama produk *
        <Input
          id="name"
          required
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Bimoli Spesial 2L"
        />
      </label>
      <label>
        Merek
        <Input id="brand" value={values.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Bimoli" />
      </label>
      <label>
        Ukuran kemasan
        <Input
          id="package_size"
          value={values.package_size}
          onChange={(e) => set("package_size", e.target.value)}
          placeholder="2L"
        />
      </label>
      <label>
        Satuan (UoM) *
        <Input id="uom" required value={values.uom} onChange={(e) => set("uom", e.target.value)} placeholder="Karton" />
      </label>
      <label>
        Satuan dasar
        <Input
          id="base_unit"
          value={values.base_unit}
          onChange={(e) => set("base_unit", e.target.value)}
          placeholder="Liter"
        />
      </label>
      <label>
        Faktor konversi
        <Input
          id="conversion_factor"
          type="number"
          min="0.01"
          step="0.01"
          value={values.conversion_factor}
          onChange={(e) => set("conversion_factor", e.target.value)}
        />
      </label>
      <label>
        Harga jual / unit
        <Input
          id="selling_price"
          type="number"
          min="0"
          step="0.01"
          value={values.selling_price}
          onChange={(e) => set("selling_price", e.target.value)}
          placeholder="0"
        />
      </label>
      <label>
        Konsumsi harian
        <Input
          id="daily_consumption_rate"
          type="number"
          min="0"
          step="0.01"
          value={values.daily_consumption_rate}
          onChange={(e) => set("daily_consumption_rate", e.target.value)}
          placeholder="0"
        />
      </label>
      <label>
        Stok minimum
        <Input
          id="min_stock_level"
          type="number"
          min="0"
          step="0.01"
          value={values.min_stock_level}
          onChange={(e) => set("min_stock_level", e.target.value)}
          placeholder="0"
        />
      </label>
      <label className="wide">
        Deskripsi
        <Textarea
          id="description"
          rows={2}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </label>
      <div className="wide flex items-center gap-2">
        <Checkbox id="is_active" checked={values.is_active} onCheckedChange={(v) => set("is_active", v === true)} />
        <label htmlFor="is_active" className="text-[13px] font-normal">
          Produk aktif
        </label>
      </div>
    </FormPage>
  );
}

/** Tanggal hari ini — dipakai placeholder input tanggal di seluruh aplikasi. */
export { todayIso };
