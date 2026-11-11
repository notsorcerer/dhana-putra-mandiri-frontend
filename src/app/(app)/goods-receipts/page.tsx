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
import type { GoodsReceipt } from "@/types/api";

export default function GoodsReceiptsPage() {
  const { session } = useAuth();
  const canCreate = can(CAN.createGoodsReceipt, session?.role);
  const { data, loading, error, page, setPage, totalPages } = usePaginated<GoodsReceipt>("/inventory/goods-receipts/");

  const columns: Column<GoodsReceipt>[] = [
    {
      key: "receipt_number",
      header: "Nomor",
      render: (row) => (
        <Link href={`/goods-receipts/${row.id}`} className="font-medium text-primary underline-offset-4 hover:underline">
          {row.receipt_number}
        </Link>
      ),
    },
    {
      key: "supplier_name",
      header: "Pemasok",
      render: (row) => <span className="text-sm">{row.supplier_name || "-"}</span>,
    },
    {
      key: "receipt_date",
      header: "Tanggal",
      render: (row) => dateId(row.receipt_date),
    },
    {
      key: "items",
      header: "Item",
      render: (row) => `${row.items.length} baris`,
    },
    {
      key: "transport_cost",
      header: "Ongkos",
      render: (row) =>
        row.transport_cost !== undefined || row.unloading_cost !== undefined ? (
          <span className="text-sm tabular-nums">
            {rupiah((Number(row.transport_cost ?? 0) || 0) + (Number(row.unloading_cost ?? 0) || 0))}
          </span>
        ) : (
          "-"
        ),
    },
    {
      key: "discrepancy",
      header: "Selisih",
      render: (row) =>
        row.has_quantity_discrepancy ? (
          <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
            Ada selisih
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        ),
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
          <Link href={`/goods-receipts/${row.id}`}>
            <ArrowRight />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Penerimaan Barang"
        description="Dokumen penerimaan barang dari pemasok (Goods Receipt). Konfirmasi akan menambah stok, memperbarui HPP rata-rata bergerak, dan memposting jurnal persediaan."
      >
        {canCreate ? (
          <Button size="sm" asChild>
            <Link href="/goods-receipts/new">
              <Plus /> Buat Penerimaan
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
        emptyText="Belum ada dokumen penerimaan barang."
        searchable
        searchPlaceholder="Cari nomor / pemasok…"
        page={page}
        totalPages={totalPages}
        total={data?.count}
        onPageChange={setPage}
      />
    </div>
  );
}
