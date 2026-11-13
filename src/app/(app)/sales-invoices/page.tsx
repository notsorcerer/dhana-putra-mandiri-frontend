"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DataTable, type Column } from "@/components/app/data-table";
import { PageHeader } from "@/components/app/page-header";
import { PeriodFilter } from "@/components/app/period-filter";
import { StatusBadge } from "@/components/app/status-badge";
import { useAuth } from "@/lib/auth";
import { dateId, rupiah } from "@/lib/format";
import { CAN, can } from "@/lib/menu";
import { usePaginated } from "@/lib/use-api";
import type { SalesInvoice } from "@/types/api";

export default function SalesInvoicesPage() {
  const { session } = useAuth();
  const canCreate = can(CAN.createInvoice, session?.role);
  const { data, loading, error, page, setPage, totalPages } =
    usePaginated<SalesInvoice>("/finance/sales-invoices/");
  const [statusFilter, setStatusFilter] = useState("");

  const rows = useMemo(() => {
    const list = data?.results ?? [];
    if (!statusFilter) return list;
    return list.filter((r) => r.status === statusFilter);
  }, [data, statusFilter]);

  const columns: Column<SalesInvoice>[] = [
    {
      key: "invoice_number",
      header: "Faktur / draf",
      render: (row) => (
        <Link href={`/sales-invoices/${row.id}`} className="doc-number">
          {row.invoice_number}
        </Link>
      ),
    },
    {
      key: "customer_name",
      header: "Pelanggan",
      render: (row) => row.customer_name || "Internal",
    },
    {
      key: "invoice_date",
      header: "Tanggal",
      render: (row) => dateId(row.invoice_date),
    },
    {
      key: "terms",
      header: "Pembayaran",
      render: (row) =>
        row.payment_method === "cash" || row.invoice_date === row.due_date
          ? "Tunai"
          : "Tempo",
    },
    {
      key: "due_date",
      header: "Jatuh tempo",
      render: (row) => (row.due_date ? dateId(row.due_date) : "—"),
    },
    {
      key: "total_amount",
      header: "Total (Rp)",
      render: (row) => rupiah(row.total_amount),
    },
    {
      key: "remaining_due",
      header: "Sisa tagihan",
      render: (row) => rupiah(row.remaining_due ?? row.remaining_balance ?? "0"),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div>
      <PageHeader title="Pesanan">
        <PeriodFilter />
        {canCreate ? (
          <Link className="button" href="/sales-invoices/new">
            Buat faktur
          </Link>
        ) : null}
      </PageHeader>

      <DataTable
        columns={columns}
        rows={rows}
        getKey={(row) => row.id}
        loading={loading}
        error={error}
        searchable
        searchPlaceholder="Cari nomor dokumen atau mitra…"
        toolbar={
          <>
            <label className="sr-only" htmlFor="status">
              Status dokumen
            </label>
            <select
              id="status"
              name="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Semua status</option>
              <option value="draft">Draft</option>
              <option value="approved">Disetujui / Belum Lunas</option>
              <option value="partially_paid">Dibayar Sebagian</option>
              <option value="paid">Lunas</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </>
        }
        page={page}
        totalPages={totalPages}
        total={data?.count}
        onPageChange={setPage}
      />
    </div>
  );
}
