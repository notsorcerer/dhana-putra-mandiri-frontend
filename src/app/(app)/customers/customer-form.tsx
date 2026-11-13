"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormPage } from "@/components/app/form-page";
import { apiPatch, apiPost } from "@/lib/api";
import type { Customer } from "@/types/api";

interface CustomerFormValues {
  code: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  tax_id: string;
  credit_limit: string;
  payment_term_days: number;
  is_active: boolean;
}

const EMPTY: CustomerFormValues = {
  code: "",
  name: "",
  contact_person: "",
  phone: "",
  email: "",
  address: "",
  tax_id: "",
  credit_limit: "0.00",
  payment_term_days: 30,
  is_active: true,
};

function toValues(customer: Customer): CustomerFormValues {
  return {
    code: customer.code,
    name: customer.name,
    contact_person: customer.contact_person ?? "",
    phone: customer.phone ?? "",
    email: customer.email ?? "",
    address: customer.address ?? "",
    tax_id: customer.tax_id ?? "",
    credit_limit: customer.credit_limit ?? "0.00",
    payment_term_days: customer.payment_term_days ?? 30,
    is_active: customer.is_active,
  };
}

/** Halaman tambah/ubah pelanggan (hanya untuk Direktur). */
export function CustomerForm({ customer }: { customer?: Customer | null }) {
  const router = useRouter();
  const editing = customer != null;
  const [values, setValues] = useState<CustomerFormValues>(customer ? toValues(customer) : EMPTY);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof CustomerFormValues>(key: K, value: CustomerFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await apiPatch<Customer>(`/finance/customers/${customer.id}/`, values);
        toast.success(`Pelanggan ${values.name} berhasil diperbarui.`);
      } else {
        await apiPost<Customer>("/finance/customers/", values);
        toast.success(`Pelanggan ${values.name} berhasil ditambahkan.`);
      }
      router.push("/customers");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan pelanggan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormPage
      eyebrow="DATA MASTER"
      title={editing ? "Ubah pelanggan" : "Tambah pelanggan"}
      description="Kode pelanggan wajib unik. Batas kredit dipakai sebagai acuan piutang."
      sectionTitle="Identitas pelanggan"
      sectionDescription="Data kontak dan batas kredit membantu penagihan serta penerimaan piutang."
      backHref="/customers"
      onSubmit={handleSubmit}
      saving={saving}
      submitLabel={editing ? "Simpan perubahan" : "Tambah pelanggan"}
    >
      <label>
        Kode *
        <Input
          id="cust-code"
          required
          value={values.code}
          onChange={(e) => set("code", e.target.value)}
          placeholder="CUS-001"
          disabled={editing}
        />
      </label>
      <label>
        Nama *
        <Input
          id="cust-name"
          required
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Toko Berkah Minyak"
        />
      </label>
      <label>
        Narahubung
        <Input
          id="cust-contact"
          value={values.contact_person}
          onChange={(e) => set("contact_person", e.target.value)}
          placeholder="Pak Dedi"
        />
      </label>
      <label>
        Telepon
        <Input
          id="cust-phone"
          value={values.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="0812-3456-7890"
        />
      </label>
      <label>
        Email
        <Input
          id="cust-email"
          type="email"
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="toko@email.com"
        />
      </label>
      <label>
        Batas kredit
        <Input
          id="cust-limit"
          type="number"
          min="0"
          step="0.01"
          value={values.credit_limit}
          onChange={(e) => set("credit_limit", e.target.value)}
        />
      </label>
      <label>
        Termin pembayaran (hari)
        <Input
          id="cust-terms"
          type="number"
          min="0"
          value={values.payment_term_days}
          onChange={(e) => set("payment_term_days", Number(e.target.value) || 0)}
        />
      </label>
      <label>
        NPWP / Tax ID
        <Input
          id="cust-tax"
          value={values.tax_id}
          onChange={(e) => set("tax_id", e.target.value)}
          placeholder="Opsional"
        />
      </label>
      <label className="wide">
        Alamat
        <Textarea
          id="cust-address"
          rows={2}
          value={values.address}
          onChange={(e) => set("address", e.target.value)}
        />
      </label>
      <div className="wide flex items-center gap-2">
        <Checkbox
          id="cust-active"
          checked={values.is_active}
          onCheckedChange={(v) => set("is_active", v === true)}
        />
        <label htmlFor="cust-active" className="text-[13px] font-normal">
          Pelanggan aktif
        </label>
      </div>
    </FormPage>
  );
}
