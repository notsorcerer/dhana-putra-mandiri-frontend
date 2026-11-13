"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
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
import { DataTable, type Column } from "@/components/app/data-table";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { ApiError, apiPost, fetchAllPages } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { dateId, rupiah, todayIso } from "@/lib/format";
import { CAN, can } from "@/lib/menu";
import { usePaginated } from "@/lib/use-api";
import type { Employee, EmployeeMutation } from "@/types/api";
import { DEPARTMENT_OPTIONS } from "../employees/employee-form";

const MUTATION_TYPE_OPTIONS = [
  { value: "PROMOTION", label: "Promosi Jabatan" },
  { value: "DEMOTION", label: "Demosi Jabatan" },
  { value: "DEPARTMENT_TRANSFER", label: "Mutasi Departemen" },
  { value: "SALARY_ADJUSTMENT", label: "Penyesuaian Gaji" },
  { value: "STATUS_CHANGE", label: "Perubahan Status" },
];

export default function EmployeeMutationsPage() {
  const { session } = useAuth();
  const canManage = can(CAN.manageHr, session?.role);
  const { data, loading, error, page, setPage, totalPages, reload } = usePaginated<EmployeeMutation>(
    "/hr/mutations/",
  );

  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    employee: "",
    mutation_date: todayIso(),
    mutation_type: "PROMOTION",
    previous_department: "",
    new_department: "",
    previous_position: "",
    new_position: "",
    previous_salary: "",
    new_salary: "",
    reason: "",
  });

  useEffect(() => {
    if (open) {
      fetchAllPages<Employee>("/hr/employees/")
        .then((rows) => setEmployees(rows.filter((e) => e.is_active)))
        .catch(() => toast.error("Gagal memuat daftar karyawan."));
    }
  }, [open]);

  const employeeMap = useMemo(() => new Map(employees.map((e) => [String(e.id), e])), [employees]);

  const pickEmployee = (employeeId: string) => {
    const employee = employeeMap.get(employeeId);
    setForm((prev) => ({
      ...prev,
      employee: employeeId,
      previous_department: employee?.department ?? prev.previous_department,
      previous_position: employee?.position ?? prev.previous_position,
      previous_salary: employee?.base_salary ?? prev.previous_salary,
      new_department: prev.new_department || (employee?.department ?? ""),
      new_position: prev.new_position || (employee?.position ?? ""),
      new_salary: prev.new_salary || (employee?.base_salary ?? ""),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await apiPost<EmployeeMutation>("/hr/mutations/", {
        ...form,
        employee: Number(form.employee),
      });
      toast.success(`Mutasi ${created.employee_name} berhasil dicatat.`);
      setOpen(false);
      setForm({
        employee: "",
        mutation_date: todayIso(),
        mutation_type: "PROMOTION",
        previous_department: "",
        new_department: "",
        previous_position: "",
        new_position: "",
        previous_salary: "",
        new_salary: "",
        reason: "",
      });
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal menyimpan mutasi.", { duration: 8000 });
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<EmployeeMutation>[] = [
    {
      key: "employee_name",
      header: "Karyawan",
      render: (row) => <span className="font-medium">{row.employee_name}</span>,
    },
    {
      key: "mutation_date",
      header: "Tanggal",
      render: (row) => dateId(row.mutation_date),
    },
    {
      key: "mutation_type",
      header: "Jenis Mutasi",
      render: (row) => <StatusBadge status={row.mutation_type} fallback={row.mutation_type_display} />,
    },
    {
      key: "position",
      header: "Jabatan",
      render: (row) => (
        <span className="text-sm">
          {row.previous_position || "-"} <span className="text-muted-foreground">→</span>{" "}
          {row.new_position || "-"}
        </span>
      ),
    },
    {
      key: "department",
      header: "Departemen",
      render: (row) => (
        <span className="text-sm">
          <StatusBadge status={row.previous_department} /> <span className="text-muted-foreground">→</span>{" "}
          <StatusBadge status={row.new_department} />
        </span>
      ),
    },
    {
      key: "salary",
      header: "Gaji",
      className: "text-right",
      render: (row) => (
        <span className="text-sm tabular-nums">
          {rupiah(row.previous_salary)} <span className="text-muted-foreground">→</span>{" "}
          {rupiah(row.new_salary)}
        </span>
      ),
    },
    {
      key: "reason",
      header: "Alasan / SK",
      render: (row) => (
        <span className="block max-w-64 truncate text-sm text-muted-foreground" title={row.reason}>
          {row.reason || "-"}
        </span>
      ),
    },
    {
      key: "approved_by_name",
      header: "Disetujui",
      render: (row) => <span className="text-sm">{row.approved_by_name || "-"}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Mutasi Karyawan"
        description="Riwayat promosi, demosi, perpindahan departemen, dan penyesuaian gaji karyawan."
      >
        {canManage ? (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus /> Catat Mutasi
          </Button>
        ) : null}
      </PageHeader>

      <DataTable
        columns={columns}
        rows={data?.results}
        getKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyText="Belum ada mutasi karyawan."
        searchable
        searchPlaceholder="Cari karyawan / jenis mutasi…"
        page={page}
        totalPages={totalPages}
        total={data?.count}
        onPageChange={setPage}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Catat Mutasi Karyawan</DialogTitle>
            <DialogDescription>
              Data jabatan, departemen, dan gaji sebelumnya terisi otomatis dari master karyawan dan dapat
              disesuaikan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="mut-employee">Karyawan *</Label>
                <select
                  id="mut-employee"
                  required
                  value={form.employee}
                  onChange={(e) => pickEmployee(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">— pilih karyawan —</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.employee_id} · {employee.full_name} ({employee.department_display})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mut-date">Tanggal Mutasi *</Label>
                <Input
                  id="mut-date"
                  type="date"
                  required
                  value={form.mutation_date}
                  onChange={(e) => setForm((p) => ({ ...p, mutation_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mut-type">Jenis Mutasi *</Label>
                <select
                  id="mut-type"
                  required
                  value={form.mutation_type}
                  onChange={(e) => setForm((p) => ({ ...p, mutation_type: e.target.value }))}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  {MUTATION_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mut-prev-dept">Departemen Lama</Label>
                <select
                  id="mut-prev-dept"
                  value={form.previous_department}
                  onChange={(e) => setForm((p) => ({ ...p, previous_department: e.target.value }))}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">—</option>
                  {DEPARTMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mut-new-dept">Departemen Baru</Label>
                <select
                  id="mut-new-dept"
                  value={form.new_department}
                  onChange={(e) => setForm((p) => ({ ...p, new_department: e.target.value }))}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">—</option>
                  {DEPARTMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mut-prev-pos">Jabatan Lama</Label>
                <Input
                  id="mut-prev-pos"
                  value={form.previous_position}
                  onChange={(e) => setForm((p) => ({ ...p, previous_position: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mut-new-pos">Jabatan Baru</Label>
                <Input
                  id="mut-new-pos"
                  value={form.new_position}
                  onChange={(e) => setForm((p) => ({ ...p, new_position: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mut-prev-salary">Gaji Lama</Label>
                <Input
                  id="mut-prev-salary"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.previous_salary}
                  onChange={(e) => setForm((p) => ({ ...p, previous_salary: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mut-new-salary">Gaji Baru</Label>
                <Input
                  id="mut-new-salary"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.new_salary}
                  onChange={(e) => setForm((p) => ({ ...p, new_salary: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mut-reason">Alasan / Nomor SK *</Label>
              <Textarea
                id="mut-reason"
                rows={3}
                required
                value={form.reason}
                onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
                placeholder="Alasan mutasi atau nomor surat keputusan…"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Batal
              </Button>
              <Button type="submit" disabled={saving || form.employee === ""}>
                {saving ? <Loader2 className="animate-spin" /> : null}
                Simpan Mutasi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
