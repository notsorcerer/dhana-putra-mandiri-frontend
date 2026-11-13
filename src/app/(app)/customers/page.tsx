"use client";

import Link from "next/link";
import { DataTable, type Column } from "@/components/app/data-table";
import { PageHeader } from "@/components/app/page-header";
import { useAuth } from "@/lib/auth";
import { rupiah } from "@/lib/format";
import { CAN, can } from "@/lib/menu";
import { usePaginated } from "@/lib/use-api";
import type { Customer } from "@/types/api";

export default function CustomersPage() {
  const { session } = useAuth();
  const canManage = can(CAN.manageMasterData, session?.role);
  const { data, loading, error, page, setPage, totalPages } =
    usePaginated<Customer>("/finance/customers/");

  const columns: Column<Customer>[] = [
    {
      key: "code",
      header: "Kode",
      render: (row) =>
        canManage ? (
          <Link href={`/customers/${row.id}/edit`} className="doc-number">
            {row.code}
          </Link>
        ) : (
          <span className="doc-number">{row.code}</span>
        ),
    },
    {
      key: "name",
      header: "Nama pelanggan",
      render: (row) => row.name,
    },
    {
      key: "contact_person",
      header: "Narahubung",
      render: (row) => row.contact_person || "—",
    },
    {
      key: "phone",
      header: "Telepon",
      render: (row) => row.phone || "—",
    },
    {
      key: "credit_limit",
      header: "Batas kredit (Rp)",
      render: (row) => rupiah(row.credit_limit),
    },
    {
      key: "is_active",
      header: "Status",
      render: (row) => (
        <span
          className="status-chip"
          data-tone={row.is_active ? "positive" : undefined}
        >
          {row.is_active ? "Aktif" : "Nonaktif"}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Pelanggan">
        {canManage ? (
          <Link className="button" href="/customers/new">
            Tambah data
          </Link>
        ) : null}
      </PageHeader>

      <DataTable
        columns={columns}
        rows={data?.results}
        getKey={(row) => row.id}
        loading={loading}
        error={error}
        searchable
        searchPlaceholder="Cari kode atau nama pelanggan…"
        page={page}
        totalPages={totalPages}
        total={data?.count}
        onPageChange={setPage}
      />
    </div>
  );
}
