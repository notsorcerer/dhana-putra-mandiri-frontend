"use client";

import Link from "next/link";
import { DataTable, type Column } from "@/components/app/data-table";
import { PageHeader } from "@/components/app/page-header";
import { PeriodFilter } from "@/components/app/period-filter";
import { StatusBadge, statusLabel } from "@/components/app/status-badge";
import { useAuth } from "@/lib/auth";
import { dateId, rupiah } from "@/lib/format";
import { CAN, can } from "@/lib/menu";
import { usePaginated } from "@/lib/use-api";
import type { Payment } from "@/types/api";

export default function PaymentsPage() {
  const { session } = useAuth();
  const canCreate = can(CAN.createPayment, session?.role);
  const { data, loading, error, page, setPage, totalPages } =
    usePaginated<Payment>("/finance/payments/");

  const columns: Column<Payment>[] = [
    {
      key: "cash_bank_account",
      header: "Akun",
      render: (row) => `${row.cash_bank_account_code} · ${row.cash_bank_account_name}`,
    },
    {
      key: "payment_date",
      header: "Tanggal",
      render: (row) => dateId(row.payment_date),
    },
    {
      key: "payment_number",
      header: "Dokumen",
      render: (row) => <span className="doc-number">{row.payment_number}</span>,
    },
    {
      key: "category",
      header: "Jenis mutasi",
      render: (row) => statusLabel(row.category),
    },
    {
      key: "party",
      header: "Mitra",
      render: (row) =>
        row.customer_name_display || row.supplier_name_display || "Internal",
    },
    {
      key: "amount",
      header: "Nilai (Rp)",
      render: (row) => rupiah(row.amount),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div>
      <PageHeader title="Mutasi kas dan bank">
        <PeriodFilter />
        {canCreate ? (
          <Link className="button" href="/payments/new">
            Catat mutasi
          </Link>
        ) : null}
      </PageHeader>

      <div className="tabs">
        <Link href="/payments" aria-current="page">
          Kas & bank
        </Link>
        <Link href="/general-ledger">Jurnal & buku besar</Link>
        <Link href="/chart-of-accounts">Bagan akun (COA)</Link>
      </div>

      <DataTable
        columns={columns}
        rows={data?.results}
        getKey={(row) => row.id}
        loading={loading}
        error={error}
        searchable
        searchPlaceholder="Cari nomor dokumen atau mitra…"
        page={page}
        totalPages={totalPages}
        total={data?.count}
        onPageChange={setPage}
      />
    </div>
  );
}
