"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { FormPage } from "@/components/app/form-page";
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

function toValues(employee: Employee): EmployeeFormValues {
  return {
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
  };
}

/** Halaman tambah/ubah karyawan (hanya untuk Direktur). */
export function EmployeeForm({ employee }: { employee?: Employee | null }) {
  const router = useRouter();
  const editing = employee != null;
  const [values, setValues] = useState<EmployeeFormValues>(employee ? toValues(employee) : EMPTY);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof EmployeeFormValues>(key: K, value: EmployeeFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await apiPatch<Employee>(`/hr/employees/${employee.id}/`, values);
        toast.success(`Karyawan ${values.full_name} berhasil diperbarui.`);
      } else {
        await apiPost<Employee>("/hr/employees/", values);
        toast.success(`Karyawan ${values.full_name} berhasil ditambahkan.`);
      }
      router.push("/hr/employees");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal menyimpan karyawan.", { duration: 8000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormPage
      eyebrow="DATA MASTER SDM"
      title={editing ? "Ubah karyawan" : "Tambah karyawan"}
      description="NIK karyawan wajib unik. Tanggal masuk wajib diisi untuk perhitungan masa kerja."
      sectionTitle="Identitas karyawan"
      sectionDescription="Data gaji dan rekening dipakai pada proses payroll."
      backHref="/hr/employees"
      onSubmit={handleSubmit}
      saving={saving}
      submitLabel={editing ? "Simpan perubahan" : "Tambah karyawan"}
    >
      <label>
        NIK karyawan *
        <Input
          id="emp-nik"
          required
          value={values.employee_id}
          onChange={(e) => set("employee_id", e.target.value)}
          placeholder="EMP-0001"
          disabled={editing}
        />
      </label>
      <label>
        Nama lengkap *
        <Input
          id="emp-name"
          required
          value={values.full_name}
          onChange={(e) => set("full_name", e.target.value)}
          placeholder="Nama karyawan"
        />
      </label>
      <label>
        Departemen *
        <select
          id="emp-dept"
          required
          value={values.department}
          onChange={(e) => set("department", e.target.value)}
        >
          {DEPARTMENT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Jabatan *
        <Input
          id="emp-position"
          required
          value={values.position}
          onChange={(e) => set("position", e.target.value)}
          placeholder="Sales Representative"
        />
      </label>
      <label>
        Tanggal masuk *
        <Input
          id="emp-joined"
          type="date"
          required
          value={values.joined_date}
          onChange={(e) => set("joined_date", e.target.value)}
        />
      </label>
      <label>
        Telepon
        <Input
          id="emp-phone"
          value={values.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="0812-3456-7890"
        />
      </label>
      <label className="wide">
        Email
        <Input
          id="emp-email"
          type="email"
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="nama@dhanaputra.co.id"
        />
      </label>
      <label>
        Gaji pokok
        <Input
          id="emp-salary"
          type="number"
          min="0"
          step="0.01"
          value={values.base_salary}
          onChange={(e) => set("base_salary", e.target.value)}
        />
      </label>
      <label>
        Tunjangan standar
        <Input
          id="emp-allowance"
          type="number"
          min="0"
          step="0.01"
          value={values.standard_allowance}
          onChange={(e) => set("standard_allowance", e.target.value)}
        />
      </label>
      <label>
        Bank
        <Input
          id="emp-bank"
          value={values.bank_name}
          onChange={(e) => set("bank_name", e.target.value)}
          placeholder="Bank Central Asia (BCA)"
        />
      </label>
      <label>
        Nomor rekening
        <Input
          id="emp-bank-acc"
          value={values.bank_account_number}
          onChange={(e) => set("bank_account_number", e.target.value)}
          placeholder="8830123456"
        />
      </label>
      <label className="wide">
        Nama pemilik rekening
        <Input
          id="emp-bank-holder"
          value={values.bank_account_holder}
          onChange={(e) => set("bank_account_holder", e.target.value)}
          placeholder="Sesuai buku tabungan"
        />
      </label>
      <div className="wide flex items-center gap-2">
        <Checkbox
          id="emp-active"
          checked={values.is_active}
          onCheckedChange={(v) => set("is_active", v === true)}
        />
        <label htmlFor="emp-active" className="text-[13px] font-normal">
          Karyawan aktif
        </label>
      </div>
    </FormPage>
  );
}
