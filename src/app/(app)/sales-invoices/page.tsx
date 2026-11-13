"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/app/data-table";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { useAuth } from "@/lib/auth";
import { CAN, can } from "@/lib/menu";
import { dateId, rupiah } from "@/lib/format";
import { usePaginated } from "@/lib/use-api";
import type { SalesInvoice } from "@/types/api";

export default function SalesInvoicesPage() {
  const { session } = useAuth();
  const canCreate = can(CAN.createInvoice, session?.role);
  const { data, loading, error, page, setPage, totalPages } = usePaginated<SalesInvoice>(
    "/finance/sales-invoices/",
  );

  const columns: Column<SalesInvoice>[] = [
    {
      key: "invoice_number",
      header: "Nomor Faktur",
      render: (row) => (
        <Link href={`/sales-invoices/${row.id}`} className="font-medium text-primary underline-offset-4 hover:underline">
          {row.invoice_number}
        </Link>
      ),
    },
    {
      key: "customer_name",
      header: "Pelanggan",
      render: (row) => <span className="text-sm">{row.customer_name || "-"}</span>,
    },
    {
      key: "invoice_date",
      header: "Tanggal",
      render: (row) => dateId(row.invoice_date),
    },
    {
      key: "due_date",
      header: "Jatuh Tempo",
      render: (row) => dateId(row.due_date),
    },
    {
      key: "total_amount",
      header: "Total",
      className: "text-right",
      render: (row) => <span className="tabular-nums">{rupiah(row.total_amount)}</span>,
    },
    {
      key: "paid_amount",
      header: "Terbayar",
      className: "text-right",
      render: (row) => <span className="tabular-nums">{rupiah(row.paid_amount)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "open",
      header: "",
      render: (row) => (
        <Button variant="ghost" size="icon-sm" asChild aria-label="Buka detail">
          <Link href={`/sales-invoices/${row.id}`}>
            <ArrowRight />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Faktur Penjualan"
        description="Faktur piutang pelanggan. Status pembayaran diperbarui dari pembayaran (BKM) yang terkait."
      >
        {canCreate ? (
          <Button size="sm" asChild>
            <Link href="/sales-invoices/new">
              <Plus /> Buat Faktur
            </Link>
          </Button>
        ) : null}
      </PageHeader>

      <DataTable
        columns={columns}
        rows={data?.results}
        getKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyText="Belum ada faktur penjualan."
        searchable
        searchPlaceholder="Cari nomor / pelanggan…"
        page={page}
        totalPages={totalPages}
        total={data?.count}
        onPageChange={setPage}
      />
    </div>
  );
}
