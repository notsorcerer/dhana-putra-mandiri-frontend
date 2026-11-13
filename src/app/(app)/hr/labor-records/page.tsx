"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DataTable, type Column } from "@/components/app/data-table";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge, statusLabel } from "@/components/app/status-badge";
import { ApiError, apiPost, fetchAllPages } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { dateId, todayIso } from "@/lib/format";
import { CAN, can, type Role } from "@/lib/menu";
import { usePaginated } from "@/lib/use-api";
import type { Employee, LaborRecord } from "@/types/api";

const RECORD_TYPE_OPTIONS = [
  { value: "ATTENDANCE_NOTE", label: "Catatan Kehadiran" },
  { value: "OVERTIME_LOG", label: "Catatan Lembur" },
  { value: "WARNING_LETTER", label: "Surat Peringatan" },
  { value: "INCIDENT", label: "Insiden Kerja" },
];

const HR_TABS: { href: string; label: string; roles: readonly Role[] }[] = [
  { href: "/hr/payroll", label: "Payroll & fee", roles: CAN.viewPayroll },
  { href: "/hr/employees", label: "Data pegawai", roles: CAN.viewEmployees },
  { href: "/hr/mutations", label: "Mutasi karyawan", roles: CAN.viewHrOps },
  { href: "/hr/labor-records", label: "Catatan kerja", roles: CAN.viewLaborRecords },
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
    record_type: "ATTENDANCE_NOTE",
    title: "",
    description: "",
    hours: "",
    hourly_rate: "",
  });

  useEffect(() => {
    if (open) {
      fetchAllPages<Employee>("/hr/employees/")
        .then((rows) => setEmployees(rows.filter((e) => e.is_active)))
        .catch(() => toast.error("Gagal memuat daftar karyawan."));
    }
  }, [open]);

  const visibleTabs = HR_TABS.filter((tab) => can(tab.roles, session?.role));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await apiPost<LaborRecord>("/hr/labor-records/", {
        employee: Number(form.employee),
        record_date: form.record_date,
        record_type: form.record_type,
        title: form.title,
        description: form.description,
        hours: form.hours === "" ? "0.00" : form.hours,
        ...(form.hourly_rate !== "" ? { hourly_rate: form.hourly_rate } : {}),
      });
      toast.success(`Catatan kerja "${created.title}" berhasil disimpan.`);
      setOpen(false);
      setForm({
        employee: "",
        record_date: todayIso(),
        record_type: "ATTENDANCE_NOTE",
        title: "",
        description: "",
        hours: "",
        hourly_rate: "",
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
      render: (row) => <strong>{row.employee_name}</strong>,
    },
    {
      key: "record_type",
      header: "Jenis Catatan",
      render: (row) => <StatusBadge status={row.record_type} fallback={row.record_type_display} />,
    },
    {
      key: "title",
      header: "Judul",
      render: (row) => <strong>{row.title}</strong>,
    },
    {
      key: "description",
      header: "Keterangan",
      render: (row) => row.description || "-",
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
      render: (row) => row.recorded_by_name || "-",
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="SUMBER DAYA MANUSIA"
        title="Catatan kerja & kehadiran"
        description="Kehadiran, lembur, insiden, surat peringatan, dan apresiasi karyawan. Catatan lembur menjadi acuan tunjangan lembur payroll."
      >
        {canManage ? (
          <Button type="button" onClick={() => setOpen((v) => !v)}>
            {open ? "Tutup Form" : "+ Tambah Catatan"}
          </Button>
        ) : null}
      </PageHeader>

      <nav className="tabs" aria-label="Tampilan halaman">
        {visibleTabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={tab.href === "/hr/labor-records" ? "page" : undefined}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {open && canManage ? (
        <form onSubmit={handleSubmit} className="panel formgrid mb-4">
          <div className="panelhead wide">
            <div>
              <h2>Tambah catatan kerja</h2>
              <p>Catatan lembur memakai jumlah jam; jenis lain dapat mengosongkan kolom jam.</p>
            </div>
          </div>

          <label className="wide" htmlFor="lab-employee">
            Karyawan *
            <select
              id="lab-employee"
              required
              value={form.employee}
              onChange={(e) => setForm((p) => ({ ...p, employee: e.target.value }))}
            >
              <option value="">— pilih karyawan —</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.employee_id} · {employee.full_name} (
                  {employee.department_display ?? statusLabel(employee.department)})
                </option>
              ))}
            </select>
          </label>

          <label htmlFor="lab-date">
            Tanggal *
            <Input
              id="lab-date"
              type="date"
              required
              value={form.record_date}
              onChange={(e) => setForm((p) => ({ ...p, record_date: e.target.value }))}
            />
          </label>

          <label htmlFor="lab-type">
            Jenis catatan *
            <select
              id="lab-type"
              required
              value={form.record_type}
              onChange={(e) => setForm((p) => ({ ...p, record_type: e.target.value }))}
            >
              {RECORD_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label htmlFor="lab-title">
            Judul *
            <Input
              id="lab-title"
              required
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Lembur bongkar muat armada"
            />
          </label>

          <label htmlFor="lab-hours">
            Jam (lembur)
            <Input
              id="lab-hours"
              type="number"
              min="0"
              step="0.25"
              value={form.hours}
              onChange={(e) => setForm((p) => ({ ...p, hours: e.target.value }))}
              placeholder="0"
            />
          </label>

          <label htmlFor="lab-rate">
            Tarif lembur per jam (Rp)
            <Input
              id="lab-rate"
              type="number"
              min="0"
              step="0.01"
              value={form.hourly_rate}
              onChange={(e) => setForm((p) => ({ ...p, hourly_rate: e.target.value }))}
              placeholder="Opsional"
            />
          </label>

          <label className="wide" htmlFor="lab-desc">
            Keterangan *
            <Textarea
              id="lab-desc"
              rows={3}
              required
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Rincian kejadian / pekerjaan…"
            />
          </label>

          <div className="form-actions wide">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" disabled={saving || form.employee === ""}>
              {saving ? <Loader2 className="animate-spin" /> : null}
              Simpan Catatan
            </Button>
          </div>
        </form>
      ) : null}

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
    </div>
  );
}
