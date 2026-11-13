"use client";

import { useState } from "react";
import { Eye, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/app/data-table";
import { Field } from "@/components/app/field";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { useAuth } from "@/lib/auth";
import { dateId, rupiah } from "@/lib/format";
import { CAN, can } from "@/lib/menu";
import { usePaginated } from "@/lib/use-api";
import type { Employee } from "@/types/api";
import { EmployeeFormDialog } from "./employee-form";

export default function EmployeesPage() {
  const { session } = useAuth();
  const canManage = can(CAN.manageEmployees, session?.role);
  const { data, loading, error, page, setPage, totalPages, reload } = usePaginated<Employee>(
    "/hr/employees/",
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [detail, setDetail] = useState<Employee | null>(null);

  const columns: Column<Employee>[] = [
    {
      key: "employee_id",
      header: "NIK",
      render: (row) => <span className="font-medium tabular-nums">{row.employee_id}</span>,
    },
    {
      key: "full_name",
      header: "Nama Karyawan",
      render: (row) => (
        <button
          type="button"
          onClick={() => setDetail(row)}
          className="text-left font-medium text-primary underline-offset-4 hover:underline"
        >
          {row.full_name}
          <span className="block text-xs font-normal text-muted-foreground">
            {row.email || row.phone || "-"}
          </span>
        </button>
      ),
    },
    {
      key: "department",
      header: "Departemen",
      render: (row) => <StatusBadge status={row.department} fallback={row.department_display} />,
    },
    {
      key: "position",
      header: "Jabatan",
      render: (row) => <span className="text-sm">{row.position}</span>,
    },
    {
      key: "base_salary",
      header: "Gaji Pokok",
      className: "text-right",
      render: (row) => <span className="tabular-nums">{rupiah(row.base_salary)}</span>,
    },
    {
      key: "joined_date",
      header: "Tanggal Masuk",
      render: (row) => dateId(row.joined_date),
    },
    {
      key: "is_active",
      header: "Status",
      render: (row) =>
        row.is_active ? (
          <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
            Aktif
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
            Nonaktif
          </span>
        ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Lihat detail" onClick={() => setDetail(row)}>
            <Eye />
          </Button>
          {canManage ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Ubah karyawan"
              onClick={() => {
                setEditing(row);
                setFormOpen(true);
              }}
            >
              <Pencil />
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Karyawan"
        description="Master data karyawan CV Dhana Putra Mandiri. Hanya Direktur yang dapat menambah atau mengubah karyawan."
      >
        {canManage ? (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus /> Tambah Karyawan
          </Button>
        ) : null}
      </PageHeader>

      <DataTable
        columns={columns}
        rows={data?.results}
        getKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyText="Belum ada karyawan terdaftar."
        searchable
        searchPlaceholder="Cari NIK / nama / jabatan…"
        page={page}
        totalPages={totalPages}
        total={data?.count}
        onPageChange={setPage}
      />

      <EmployeeFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        employee={editing}
        onSaved={reload}
      />

      <Dialog open={detail !== null} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {detail ? (
            <>
              <DialogHeader>
                <DialogTitle>{detail.full_name}</DialogTitle>
                <DialogDescription>
                  {detail.employee_id} · {detail.department_display} · {detail.position}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email" value={detail.email || "-"} />
                <Field label="Telepon" value={detail.phone || "-"} />
                <Field label="Gaji Pokok" value={rupiah(detail.base_salary)} />
                <Field label="Tunjangan Standar" value={rupiah(detail.standard_allowance)} />
                <Field label="Bank" value={detail.bank_name || "-"} />
                <Field
                  label="Rekening"
                  value={
                    detail.bank_account_number
                      ? `${detail.bank_account_number}${detail.bank_account_holder ? ` · ${detail.bank_account_holder}` : ""}`
                      : "-"
                  }
                />
                <Field label="Tanggal Masuk" value={dateId(detail.joined_date)} />
                <Field
                  label="Status"
                  value={
                    detail.is_active ? (
                      <span className="text-emerald-600 dark:text-emerald-400">Aktif</span>
                    ) : (
                      <span className="text-muted-foreground">Nonaktif</span>
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Riwayat Mutasi ({detail.mutations.length})</h3>
                {detail.mutations.length === 0 ? (
                  <p className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                    Belum ada mutasi.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {detail.mutations.map((m) => (
                      <li key={m.id} className="rounded-md border px-3 py-2 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="font-medium">{m.mutation_type_display}</span>
                          <span className="text-xs text-muted-foreground">{dateId(m.mutation_date)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {m.previous_position || "-"} → {m.new_position || "-"} · {rupiah(m.previous_salary)} →{" "}
                          {rupiah(m.new_salary)}
                        </p>
                        <p className="mt-1 text-xs">{m.reason}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Catatan Kerja ({detail.labor_records.length})</h3>
                {detail.labor_records.length === 0 ? (
                  <p className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                    Belum ada catatan kerja.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {detail.labor_records.map((r) => (
                      <li key={r.id} className="rounded-md border px-3 py-2 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="font-medium">{r.title}</span>
                          <span className="text-xs text-muted-foreground">{dateId(r.record_date)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {r.record_type_display}
                          {Number(r.hours) > 0 ? ` · ${r.hours} jam` : ""}
                        </p>
                        <p className="mt-1 text-xs">{r.description}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
