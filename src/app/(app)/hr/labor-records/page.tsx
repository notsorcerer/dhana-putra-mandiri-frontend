"use client";

import { useEffect, useState } from "react";
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
import { dateId, todayIso } from "@/lib/format";
import { CAN, can } from "@/lib/menu";
import { usePaginated } from "@/lib/use-api";
import type { Employee, LaborRecord } from "@/types/api";

const RECORD_TYPE_OPTIONS = [
  { value: "ATTENDANCE_NOTE", label: "Catatan Kehadiran" },
  { value: "OVERTIME_LOG", label: "Catatan Lembur" },
  { value: "INCIDENT", label: "Insiden Kerja" },
  { value: "WARNING_LETTER", label: "Surat Peringatan" },
  { value: "COMMENDATION", label: "Apresiasi / Prestasi" },
  { value: "GENERAL", label: "Catatan Umum" },
];

export default function LaborRecordsPage() {
  const { session } = useAuth();
  const canManage = can(CAN.manageHr, session?.role);
  const { data, loading, error, page, setPage, totalPages, reload } = usePaginated<LaborRecord>(
    "/hr/labor-records/",
  );

  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    employee: "",
    record_date: todayIso(),
    record_type: "GENERAL",
    title: "",
    description: "",
    hours: "",
  });

  useEffect(() => {
    if (open) {
      fetchAllPages<Employee>("/hr/employees/")
        .then((rows) => setEmployees(rows.filter((e) => e.is_active)))
        .catch(() => toast.error("Gagal memuat daftar karyawan."));
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await apiPost<LaborRecord>("/hr/labor-records/", {
        ...form,
        employee: Number(form.employee),
        hours: form.hours === "" ? "0.00" : form.hours,
      });
      toast.success(`Catatan kerja "${created.title}" berhasil disimpan.`);
      setOpen(false);
      setForm({
        employee: "",
        record_date: todayIso(),
        record_type: "GENERAL",
        title: "",
        description: "",
        hours: "",
      });
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal menyimpan catatan kerja.", { duration: 8000 });
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<LaborRecord>[] = [
    {
      key: "record_date",
      header: "Tanggal",
      render: (row) => dateId(row.record_date),
    },
    {
      key: "employee_name",
      header: "Karyawan",
      render: (row) => <span className="font-medium">{row.employee_name}</span>,
    },
    {
      key: "record_type",
      header: "Jenis Catatan",
      render: (row) => <StatusBadge status={row.record_type} fallback={row.record_type_display} />,
    },
    {
      key: "title",
      header: "Judul",
      render: (row) => <span className="text-sm font-medium">{row.title}</span>,
    },
    {
      key: "description",
      header: "Keterangan",
      render: (row) => (
        <span className="block max-w-72 truncate text-sm text-muted-foreground" title={row.description}>
          {row.description || "-"}
        </span>
      ),
    },
    {
      key: "hours",
      header: "Jam",
      className: "text-right",
      render: (row) => (
        <span className="tabular-nums">{Number(row.hours) > 0 ? `${row.hours} jam` : "-"}</span>
      ),
    },
    {
      key: "recorded_by_name",
      header: "Dicatat Oleh",
      render: (row) => <span className="text-sm">{row.recorded_by_name || "-"}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Catatan Kerja"
        description="Kehadiran, lembur, insiden, surat peringatan, dan apresiasi karyawan. Catatan lembur menjadi acuan tunjangan lembur payroll."
      >
        {canManage ? (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus /> Tambah Catatan
          </Button>
        ) : null}
      </PageHeader>

      <DataTable
        columns={columns}
        rows={data?.results}
        getKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyText="Belum ada catatan kerja."
        searchable
        searchPlaceholder="Cari karyawan / judul catatan…"
        page={page}
        totalPages={totalPages}
        total={data?.count}
        onPageChange={setPage}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Tambah Catatan Kerja</DialogTitle>
            <DialogDescription>
              Catatan lembur memakai jumlah jam; jenis lain dapat mengosongkan kolom jam.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="lab-employee">Karyawan *</Label>
                <select
                  id="lab-employee"
                  required
                  value={form.employee}
                  onChange={(e) => setForm((p) => ({ ...p, employee: e.target.value }))}
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
                <Label htmlFor="lab-date">Tanggal *</Label>
                <Input
                  id="lab-date"
                  type="date"
                  required
                  value={form.record_date}
                  onChange={(e) => setForm((p) => ({ ...p, record_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lab-type">Jenis Catatan *</Label>
                <select
                  id="lab-type"
                  required
                  value={form.record_type}
                  onChange={(e) => setForm((p) => ({ ...p, record_type: e.target.value }))}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  {RECORD_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="lab-title">Judul *</Label>
                <Input
                  id="lab-title"
                  required
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Lembur bongkar muat armada"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lab-hours">Jam (lembur)</Label>
                <Input
                  id="lab-hours"
                  type="number"
                  min="0"
                  step="0.25"
                  value={form.hours}
                  onChange={(e) => setForm((p) => ({ ...p, hours: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lab-desc">Keterangan *</Label>
              <Textarea
                id="lab-desc"
                rows={3}
                required
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Rincian kejadian / pekerjaan…"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Batal
              </Button>
              <Button type="submit" disabled={saving || form.employee === ""}>
                {saving ? <Loader2 className="animate-spin" /> : null}
                Simpan Catatan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
