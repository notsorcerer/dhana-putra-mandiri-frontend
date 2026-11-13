"use client";

import Link from "next/link";
import { DataTable, type Column } from "@/components/app/data-table";
import { PageHeader } from "@/components/app/page-header";
import { PeriodFilter } from "@/components/app/period-filter";
import { dateTimeId, qty } from "@/lib/format";
import { usePaginated } from "@/lib/use-api";
import type { StockMovement } from "@/types/api";

export default function StockMovementsPage() {
  const { data, loading, error, page, setPage, totalPages } =
    usePaginated<StockMovement>("/inventory/stock-movements/");

  const columns: Column<StockMovement>[] = [
    {
      key: "reference_number",
      header: "Dokumen",
      render: (row) => <span className="doc-number">{row.reference_number}</span>,
    },
    {
      key: "movement_date",
      header: "Tanggal",
      render: (row) => dateTimeId(row.movement_date),
    },
    {
      key: "product_name",
      header: "Produk",
      render: (row) => `${row.product_sku} · ${row.product_name}`,
    },
    {
      key: "qty",
      header: "Gerakan",
      render: (row) =>
        `${row.movement_type === "IN" ? "+" : "−"}${qty(row.qty)}`,
    },
    {
      key: "stock_after",
      header: "Saldo",
      render: (row) => qty(row.stock_after),
    },
    {
      key: "product_uom",
      header: "Satuan",
      render: (row) => row.product_uom,
    },
  ];

  return (
    <div>
      <PageHeader title="Kartu stok">
        <PeriodFilter />
      </PageHeader>

      <div className="tabs">
        <Link href="/products">Persediaan</Link>
        <Link href="/products/abc-analysis">Analisis ABC dan risiko</Link>
        <Link href="/stock-movements" aria-current="page">
          Kartu & pergerakan stok
        </Link>
      </div>

      <DataTable
        columns={columns}
        rows={data?.results}
        getKey={(row) => row.id}
        loading={loading}
        error={error}
        searchable
        searchPlaceholder="Cari dokumen atau produk…"
        page={page}
        totalPages={totalPages}
        total={data?.count}
        onPageChange={setPage}
      />
    </div>
  );
}
