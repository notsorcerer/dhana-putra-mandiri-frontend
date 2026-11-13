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

/** Dialog tambah/ubah pemasok (hanya untuk Direktur). */
export function SupplierFormDialog({
  open,
  onOpenChange,
  supplier,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<SupplierFormValues>(EMPTY);
  const [saving, setSaving] = useState(false);
  const editing = supplier != null;

  useEffect(() => {
    if (open) {
      // Isi ulang form dari data pemasok terpilih saat dialog dibuka.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValues(
        supplier
          ? {
              code: supplier.code,
              name: supplier.name,
              contact_person: supplier.contact_person ?? "",
              phone: supplier.phone ?? "",
              email: supplier.email ?? "",
              address: supplier.address ?? "",
              is_active: supplier.is_active,
            }
          : EMPTY,
      );
    }
  }, [open, supplier]);

  const set = <K extends keyof SupplierFormValues>(key: K, value: SupplierFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await apiPatch<Supplier>(`/finance/suppliers/${supplier!.id}/`, values);
        toast.success(`Pemasok ${values.name} berhasil diperbarui.`);
      } else {
        await apiPost<Supplier>("/finance/suppliers/", values);
        toast.success(`Pemasok ${values.name} berhasil ditambahkan.`);
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan pemasok.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Ubah Pemasok" : "Tambah Pemasok"}</DialogTitle>
          <DialogDescription>Kode pemasok wajib unik.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sup-code">Kode *</Label>
              <Input id="sup-code" required value={values.code} onChange={(e) => set("code", e.target.value)} placeholder="SUP-001" disabled={editing} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sup-name">Nama *</Label>
              <Input id="sup-name" required value={values.name} onChange={(e) => set("name", e.target.value)} placeholder="PT Salim Ivomas Pratama" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sup-contact">Narahubung</Label>
              <Input id="sup-contact" value={values.contact_person} onChange={(e) => set("contact_person", e.target.value)} placeholder="Bu Rina" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sup-phone">Telepon</Label>
              <Input id="sup-phone" value={values.phone} onChange={(e) => set("phone", e.target.value)} placeholder="021-555-111" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sup-email">Email</Label>
              <Input id="sup-email" type="email" value={values.email} onChange={(e) => set("email", e.target.value)} placeholder="sales@pemasok.co.id" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sup-address">Alamat</Label>
            <Textarea id="sup-address" rows={2} value={values.address} onChange={(e) => set("address", e.target.value)} />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="sup-active" checked={values.is_active} onCheckedChange={(v) => set("is_active", v === true)} />
            <Label htmlFor="sup-active" className="font-normal">
              Pemasok aktif
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : null}
              {editing ? "Simpan Perubahan" : "Tambah Pemasok"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
