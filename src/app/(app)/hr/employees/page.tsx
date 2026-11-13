"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/app/data-table";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { useAuth } from "@/lib/auth";
import { dateId, rupiah } from "@/lib/format";
import { CAN, can, type Role } from "@/lib/menu";
import { usePaginated } from "@/lib/use-api";
import type { Employee } from "@/types/api";

const HR_TABS: { href: string; label: string; roles: readonly Role[] }[] = [
  { href: "/hr/payroll", label: "Payroll & fee", roles: CAN.viewPayroll },
  { href: "/hr/employees", label: "Data pegawai", roles: CAN.viewEmployees },
  { href: "/hr/mutations", label: "Mutasi karyawan", roles: CAN.viewHrOps },
  { href: "/hr/labor-records", label: "Catatan kerja", roles: CAN.viewLaborRecords },
];

export default function EmployeesPage() {
  const { session } = useAuth();
  const canManage = can(CAN.manageEmployees, session?.role);
  const { data, loading, error, page, setPage, totalPages } = usePaginated<Employee>(
    "/hr/employees/",
  );

  const [detail, setDetail] = useState<Employee | null>(null);
  const visibleTabs = HR_TABS.filter((tab) => can(tab.roles, session?.role));

  const columns: Column<Employee>[] = [
    {
      key: "employee_id",
      header: "NIK",
      render: (row) => (
        <button
          type="button"
          onClick={() => setDetail(row)}
          className="doclink text-left tabular-nums"
        >
          <strong>{row.employee_id}</strong>
        </button>
      ),
    },
    {
      key: "full_name",
      header: "Nama Karyawan",
      render: (row) => (
        <div>
          <button
            type="button"
            onClick={() => setDetail(row)}
            className="doclink text-left"
          >
            <strong>{row.full_name}</strong>
          </button>
          <div className="text-xs text-muted-foreground">
            {row.email || row.phone || "-"}
          </div>
        </div>
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
      render: (row) => row.position,
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
          <span className="status-chip" data-tone="positive">
            Aktif
          </span>
        ) : (
          <span className="status-chip">
            Nonaktif
          </span>
        ),
    },
    {
      key: "actions",
      header: "",
      render: (row) =>
        canManage ? (
          <Link className="doclink" href={`/hr/employees/${row.id}/edit`}>
            Ubah
          </Link>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="SUMBER DAYA MANUSIA"
        title="Data pegawai & kompensasi"
        description="Master data karyawan CV Dhana Putra Mandiri. Hanya Direktur yang dapat menambah atau mengubah karyawan."
      >
        {canManage ? (
          <Button asChild>
            <Link href="/hr/employees/new">+ Tambah Karyawan</Link>
          </Button>
        ) : null}
      </PageHeader>

      <nav className="tabs" aria-label="Tampilan halaman">
        {visibleTabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={tab.href === "/hr/employees" ? "page" : undefined}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {detail ? (
        <section className="panel scroll mb-4">
          <div className="panelhead">
            <div>
              <h2>
                {detail.full_name} ({detail.employee_id})
              </h2>
              <p>
                {detail.department_display} · {detail.position} · Masuk {dateId(detail.joined_date)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {canManage ? (
                <Button variant="outline" asChild>
                  <Link href={`/hr/employees/${detail.id}/edit`}>Ubah Karyawan</Link>
                </Button>
              ) : null}
              <Button type="button" variant="outline" onClick={() => setDetail(null)}>
                Tutup rincian
              </Button>
            </div>
          </div>

          <div className="meta-grid mb-4">
            <div>
              <span>Email</span>
              <strong>{detail.email || "-"}</strong>
            </div>
            <div>
              <span>Telepon</span>
              <strong>{detail.phone || "-"}</strong>
            </div>
            <div>
              <span>Gaji Pokok</span>
              <strong>{rupiah(detail.base_salary)}</strong>
            </div>
            <div>
              <span>Tunjangan Standar</span>
              <strong>{rupiah(detail.standard_allowance)}</strong>
            </div>
            <div>
              <span>Bank & Rekening</span>
              <strong>
                {detail.bank_name || "-"}{" "}
                {detail.bank_account_number ? `· ${detail.bank_account_number}` : ""}
              </strong>
            </div>
            <div>
              <span>Status Kepegawaian</span>
              <strong>{detail.is_active ? "Aktif" : "Nonaktif"}</strong>
            </div>
          </div>

          {detail.mutations.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Tanggal Mutasi</th>
                  <th>Jenis</th>
                  <th>Perubahan Jabatan</th>
                  <th className="text-right">Perubahan Gaji</th>
                  <th>Alasan / SK</th>
                </tr>
              </thead>
              <tbody>
                {detail.mutations.map((m) => (
                  <tr key={m.id}>
                    <td>{dateId(m.mutation_date)}</td>
                    <td>
                      <strong>{m.mutation_type_display}</strong>
                    </td>
                    <td>
                      {m.previous_position || "-"} → {m.new_position || "-"}
                    </td>
                    <td className="text-right tabular-nums">
                      {rupiah(m.previous_salary)} → {rupiah(m.new_salary)}
                    </td>
                    <td>{m.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </section>
      ) : null}

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
    </div>
  );
}
