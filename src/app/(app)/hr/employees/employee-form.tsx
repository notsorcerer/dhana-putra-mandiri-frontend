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
import { Checkbox } from "@/components/ui/checkbox";
import { ApiError, apiPatch, apiPost } from "@/lib/api";
import type { Employee } from "@/types/api";

export const DEPARTMENT_OPTIONS = [
  { value: "direksi", label: "Direksi" },
  { value: "sales", label: "Sales & Marketing" },
  { value: "gudang", label: "Gudang & Logistik" },
  { value: "finance", label: "Finance (Kasir)" },
  { value: "accounting", label: "Accounting & Pajak" },
  { value: "general", label: "Umum & Operasional" },
];

interface EmployeeFormValues {
  employee_id: string;
  full_name: string;
  department: string;
  position: string;
  joined_date: string;
  email: string;
  phone: string;
  base_salary: string;
  standard_allowance: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_holder: string;
  is_active: boolean;
}

const EMPTY: EmployeeFormValues = {
  employee_id: "",
  full_name: "",
  department: "general",
  position: "",
  joined_date: "",
  email: "",
  phone: "",
  base_salary: "0.00",
  standard_allowance: "0.00",
  bank_name: "",
  bank_account_number: "",
  bank_account_holder: "",
  is_active: true,
};

/** Dialog tambah/ubah karyawan (hanya untuk Direktur). */
export function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<EmployeeFormValues>(EMPTY);
  const [saving, setSaving] = useState(false);
  const editing = employee != null;

  useEffect(() => {
    if (open) {
      // Isi ulang form dari data karyawan terpilih saat dialog dibuka.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValues(
        employee
          ? {
              employee_id: employee.employee_id,
              full_name: employee.full_name,
              department: employee.department,
              position: employee.position,
              joined_date: employee.joined_date,
              email: employee.email ?? "",
              phone: employee.phone ?? "",
              base_salary: employee.base_salary ?? "0.00",
              standard_allowance: employee.standard_allowance ?? "0.00",
              bank_name: employee.bank_name ?? "",
              bank_account_number: employee.bank_account_number ?? "",
              bank_account_holder: employee.bank_account_holder ?? "",
              is_active: employee.is_active,
            }
          : EMPTY,
      );
    }
  }, [open, employee]);

  const set = <K extends keyof EmployeeFormValues>(key: K, value: EmployeeFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await apiPatch<Employee>(`/hr/employees/${employee!.id}/`, values);
        toast.success(`Karyawan ${values.full_name} berhasil diperbarui.`);
      } else {
        await apiPost<Employee>("/hr/employees/", values);
        toast.success(`Karyawan ${values.full_name} berhasil ditambahkan.`);
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal menyimpan karyawan.", { duration: 8000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Ubah Karyawan" : "Tambah Karyawan"}</DialogTitle>
          <DialogDescription>
            NIK karyawan wajib unik. Tanggal masuk wajib diisi untuk perhitungan masa kerja.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="emp-nik">NIK Karyawan *</Label>
              <Input
                id="emp-nik"
                required
                value={values.employee_id}
                onChange={(e) => set("employee_id", e.target.value)}
                placeholder="EMP-0001"
                disabled={editing}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-name">Nama Lengkap *</Label>
              <Input
                id="emp-name"
                required
                value={values.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                placeholder="Nama karyawan"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-dept">Departemen *</Label>
              <select
                id="emp-dept"
                required
                value={values.department}
                onChange={(e) => set("department", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {DEPARTMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-position">Jabatan *</Label>
              <Input
                id="emp-position"
                required
                value={values.position}
                onChange={(e) => set("position", e.target.value)}
                placeholder="Sales Representative"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-joined">Tanggal Masuk *</Label>
              <Input
                id="emp-joined"
                type="date"
                required
                value={values.joined_date}
                onChange={(e) => set("joined_date", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-phone">Telepon</Label>
              <Input
                id="emp-phone"
                value={values.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="0812-3456-7890"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="emp-email">Email</Label>
              <Input
                id="emp-email"
                type="email"
                value={values.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="nama@dhanaputra.co.id"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-salary">Gaji Pokok</Label>
              <Input
                id="emp-salary"
                type="number"
                min="0"
                step="0.01"
                value={values.base_salary}
                onChange={(e) => set("base_salary", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-allowance">Tunjangan Standar</Label>
              <Input
                id="emp-allowance"
                type="number"
                min="0"
                step="0.01"
                value={values.standard_allowance}
                onChange={(e) => set("standard_allowance", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-bank">Bank</Label>
              <Input
                id="emp-bank"
                value={values.bank_name}
                onChange={(e) => set("bank_name", e.target.value)}
                placeholder="Bank Central Asia (BCA)"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-bank-acc">Nomor Rekening</Label>
              <Input
                id="emp-bank-acc"
                value={values.bank_account_number}
                onChange={(e) => set("bank_account_number", e.target.value)}
                placeholder="8830123456"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="emp-bank-holder">Nama Pemilik Rekening</Label>
              <Input
                id="emp-bank-holder"
                value={values.bank_account_holder}
                onChange={(e) => set("bank_account_holder", e.target.value)}
                placeholder="Sesuai buku tabungan"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="emp-active"
              checked={values.is_active}
              onCheckedChange={(v) => set("is_active", v === true)}
            />
            <Label htmlFor="emp-active" className="font-normal">
              Karyawan aktif
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : null}
              {editing ? "Simpan Perubahan" : "Tambah Karyawan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
