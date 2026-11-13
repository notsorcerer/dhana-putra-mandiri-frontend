"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { apiPatch, apiPost } from "@/lib/api";
import type { Customer } from "@/types/api";

interface CustomerFormValues {
  code: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  credit_limit: string;
  is_active: boolean;
}

const EMPTY: CustomerFormValues = {
  code: "",
  name: "",
  contact_person: "",
  phone: "",
  email: "",
  address: "",
  credit_limit: "0.00",
  is_active: true,
};

/** Dialog tambah/ubah pelanggan (hanya untuk Direktur). */
export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<CustomerFormValues>(EMPTY);
  const [saving, setSaving] = useState(false);
  const editing = customer != null;

  useEffect(() => {
    if (open) {
      // Isi ulang form dari data pelanggan terpilih saat dialog dibuka.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValues(
        customer
          ? {
              code: customer.code,
              name: customer.name,
              contact_person: customer.contact_person ?? "",
              phone: customer.phone ?? "",
              email: customer.email ?? "",
              address: customer.address ?? "",
              credit_limit: customer.credit_limit ?? "0.00",
              is_active: customer.is_active,
            }
          : EMPTY,
      );
    }
  }, [open, customer]);

  const set = <K extends keyof CustomerFormValues>(key: K, value: CustomerFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await apiPatch<Customer>(`/finance/customers/${customer!.id}/`, values);
        toast.success(`Pelanggan ${values.name} berhasil diperbarui.`);
      } else {
        await apiPost<Customer>("/finance/customers/", values);
        toast.success(`Pelanggan ${values.name} berhasil ditambahkan.`);
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan pelanggan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Ubah Pelanggan" : "Tambah Pelanggan"}</DialogTitle>
          <DialogDescription>
            Kode pelanggan wajib unik. Batas kredit dipakai sebagai acuan piutang.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cust-code">Kode *</Label>
              <Input id="cust-code" required value={values.code} onChange={(e) => set("code", e.target.value)} placeholder="CUS-001" disabled={editing} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-name">Nama *</Label>
              <Input id="cust-name" required value={values.name} onChange={(e) => set("name", e.target.value)} placeholder="Toko Berkah Minyak" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-contact">Narahubung</Label>
              <Input id="cust-contact" value={values.contact_person} onChange={(e) => set("contact_person", e.target.value)} placeholder="Pak Dedi" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-phone">Telepon</Label>
              <Input id="cust-phone" value={values.phone} onChange={(e) => set("phone", e.target.value)} placeholder="0812-3456-7890" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-email">Email</Label>
              <Input id="cust-email" type="email" value={values.email} onChange={(e) => set("email", e.target.value)} placeholder="toko@email.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-limit">Batas Kredit</Label>
              <Input id="cust-limit" type="number" min="0" step="0.01" value={values.credit_limit} onChange={(e) => set("credit_limit", e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cust-address">Alamat</Label>
            <Textarea id="cust-address" rows={2} value={values.address} onChange={(e) => set("address", e.target.value)} />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="cust-active" checked={values.is_active} onCheckedChange={(v) => set("is_active", v === true)} />
            <Label htmlFor="cust-active" className="font-normal">
              Pelanggan aktif
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : null}
              {editing ? "Simpan Perubahan" : "Tambah Pelanggan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
