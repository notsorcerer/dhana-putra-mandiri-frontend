"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormPage } from "@/components/app/form-page";
import { apiPatch, apiPost } from "@/lib/api";
import type { Supplier } from "@/types/api";

interface SupplierFormValues {
  code: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  is_active: boolean;
}

const EMPTY: SupplierFormValues = {
  code: "",
  name: "",
  contact_person: "",
  phone: "",
  email: "",
  address: "",
  is_active: true,
};

function toValues(supplier: Supplier): SupplierFormValues {
  return {
    code: supplier.code,
    name: supplier.name,
    contact_person: supplier.contact_person ?? "",
    phone: supplier.phone ?? "",
    email: supplier.email ?? "",
    address: supplier.address ?? "",
    is_active: supplier.is_active,
  };
}

/** Halaman tambah/ubah pemasok (hanya untuk Direktur). */
export function SupplierForm({ supplier }: { supplier?: Supplier | null }) {
  const router = useRouter();
  const editing = supplier != null;
  const [values, setValues] = useState<SupplierFormValues>(supplier ? toValues(supplier) : EMPTY);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof SupplierFormValues>(key: K, value: SupplierFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await apiPatch<Supplier>(`/finance/suppliers/${supplier.id}/`, values);
        toast.success(`Pemasok ${values.name} berhasil diperbarui.`);
      } else {
        await apiPost<Supplier>("/finance/suppliers/", values);
        toast.success(`Pemasok ${values.name} berhasil ditambahkan.`);
      }
      router.push("/suppliers");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan pemasok.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormPage
      eyebrow="DATA MASTER"
      title={editing ? "Ubah pemasok" : "Tambah pemasok"}
      description="Kode pemasok wajib unik. Data ini dipakai pada penerimaan barang dan pembayaran hutang."
      sectionTitle="Identitas pemasok"
      sectionDescription="Lengkapi kontak principal untuk mempermudah komunikasi pembelian."
      backHref="/suppliers"
      onSubmit={handleSubmit}
      saving={saving}
      submitLabel={editing ? "Simpan perubahan" : "Tambah pemasok"}
    >
      <label>
        Kode *
        <Input
          id="sup-code"
          required
          value={values.code}
          onChange={(e) => set("code", e.target.value)}
          placeholder="SUP-001"
          disabled={editing}
        />
      </label>
      <label>
        Nama *
        <Input
          id="sup-name"
          required
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="PT Salim Ivomas Pratama"
        />
      </label>
      <label>
        Narahubung
        <Input
          id="sup-contact"
          value={values.contact_person}
          onChange={(e) => set("contact_person", e.target.value)}
          placeholder="Bu Rina"
        />
      </label>
      <label>
        Telepon
        <Input
          id="sup-phone"
          value={values.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="021-555-111"
        />
      </label>
      <label className="wide">
        Email
        <Input
          id="sup-email"
          type="email"
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="sales@pemasok.co.id"
        />
      </label>
      <label className="wide">
        Alamat
        <Textarea
          id="sup-address"
          rows={2}
          value={values.address}
          onChange={(e) => set("address", e.target.value)}
        />
      </label>
      <div className="wide flex items-center gap-2">
        <Checkbox
          id="sup-active"
          checked={values.is_active}
          onCheckedChange={(v) => set("is_active", v === true)}
        />
        <label htmlFor="sup-active" className="text-[13px] font-normal">
          Pemasok aktif
        </label>
      </div>
    </FormPage>
  );
}
