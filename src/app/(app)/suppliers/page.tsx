"use client";

import Link from "next/link";
import { DataTable, type Column } from "@/components/app/data-table";
import { PageHeader } from "@/components/app/page-header";
import { useAuth } from "@/lib/auth";
import { CAN, can } from "@/lib/menu";
import { usePaginated } from "@/lib/use-api";
import type { Supplier } from "@/types/api";

export default function SuppliersPage() {
  const { session } = useAuth();
  const canManage = can(CAN.manageMasterData, session?.role);
  const { data, loading, error, page, setPage, totalPages } =
    usePaginated<Supplier>("/finance/suppliers/");

  const columns: Column<Supplier>[] = [
    {
      key: "code",
      header: "Kode",
      render: (row) =>
        canManage ? (
          <Link href={`/suppliers/${row.id}/edit`} className="doc-number">
            {row.code}
          </Link>
        ) : (
          <span className="doc-number">{row.code}</span>
        ),
    },
    {
      key: "name",
      header: "Nama pemasok",
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
      key: "email",
      header: "Email",
      render: (row) => row.email || "—",
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
      <PageHeader title="Pemasok">
        {canManage ? (
          <Link className="button" href="/suppliers/new">
            Tambah data
          </Link>
        ) : null}
      </PageHeader>

      <div className="tabs">
        <Link href="/suppliers" aria-current="page">
          Pemasok
        </Link>
        <Link href="/customers">Pelanggan</Link>
        <Link href="/products">Produk</Link>
        <Link href="/chart-of-accounts">Bagan akun</Link>
        <Link href="/hr/employees">Pegawai</Link>
      </div>

      <DataTable
        columns={columns}
        rows={data?.results}
        getKey={(row) => row.id}
        loading={loading}
        error={error}
        searchable
        searchPlaceholder="Cari kode atau nama pemasok…"
        page={page}
        totalPages={totalPages}
        total={data?.count}
        onPageChange={setPage}
      />
    </div>
  );
}
