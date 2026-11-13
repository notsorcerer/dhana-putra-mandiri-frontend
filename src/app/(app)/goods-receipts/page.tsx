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
import type { GoodsReceipt } from "@/types/api";

export default function GoodsReceiptsPage() {
  const { session } = useAuth();
  const canCreate = can(CAN.createGoodsReceipt, session?.role);
  const { data, loading, error, page, setPage, totalPages } =
    usePaginated<GoodsReceipt>("/inventory/goods-receipts/");
  const [statusFilter, setStatusFilter] = useState("");

  const rows = useMemo(() => {
    const list = data?.results ?? [];
    if (!statusFilter) return list;
    return list.filter((r) => r.status === statusFilter);
  }, [data, statusFilter]);

  const columns: Column<GoodsReceipt>[] = [
    {
      key: "receipt_number",
      header: "Nomor",
      render: (row) => (
        <Link href={`/goods-receipts/${row.id}`} className="doc-number">
          {row.receipt_number}
        </Link>
      ),
    },
    {
      key: "receipt_date",
      header: "Tanggal",
      render: (row) => dateId(row.receipt_date),
    },
    {
      key: "kind",
      header: "Jenis",
      render: () => "Penerimaan",
    },
    {
      key: "supplier_name",
      header: "Mitra",
      render: (row) => row.supplier_name || "Internal",
    },
    {
      key: "transport_cost",
      header: "Biaya angkut & bongkar",
      render: (row) =>
        row.transport_cost !== undefined || row.unloading_cost !== undefined
          ? rupiah(
              (Number(row.transport_cost ?? 0) || 0) +
                (Number(row.unloading_cost ?? 0) || 0),
            )
          : "—",
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div>
      <PageHeader title="Pembelian">
        <PeriodFilter />
        {canCreate ? (
          <Link className="button" href="/goods-receipts/new">
            Penerimaan
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
              <option value="confirmed">Dikonfirmasi</option>
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
