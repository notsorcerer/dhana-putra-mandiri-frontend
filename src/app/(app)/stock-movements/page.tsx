"use client";

import { DataTable, type Column } from "@/components/app/data-table";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { dateTimeId, qty, rupiah } from "@/lib/format";
import { usePaginated } from "@/lib/use-api";
import type { StockMovement } from "@/types/api";

export default function StockMovementsPage() {
  const { data, loading, error, page, setPage, totalPages } = usePaginated<StockMovement>("/inventory/stock-movements/");

  const columns: Column<StockMovement>[] = [
    {
      key: "movement_date",
      header: "Waktu",
      render: (row) => <span className="text-sm whitespace-nowrap">{dateTimeId(row.movement_date)}</span>,
    },
    {
      key: "product",
      header: "Produk",
      render: (row) => (
        <div>
          <p className="font-medium">{row.product_name}</p>
          <p className="text-xs text-muted-foreground">{row.product_sku}</p>
        </div>
      ),
    },
    {
      key: "movement_type",
      header: "Jenis",
      render: (row) => <StatusBadge status={row.movement_type} />,
    },
    {
      key: "qty",
      header: "Jumlah",
      render: (row) => (
        <span className="tabular-nums">
          {row.movement_type === "IN" ? "+" : "−"}
          {qty(row.qty)} <span className="text-xs text-muted-foreground">{row.product_uom}</span>
        </span>
      ),
    },
    {
      key: "stock_after",
      header: "Stok",
      render: (row) => (
        <span className="tabular-nums text-muted-foreground">
          {qty(row.stock_before)} → <span className="font-medium text-foreground">{qty(row.stock_after)}</span>
        </span>
      ),
    },
    {
      key: "unit_cost",
      header: "Biaya / unit",
      render: (row) => <span className="tabular-nums">{rupiah(row.unit_cost)}</span>,
    },
    {
      key: "reference",
      header: "Referensi",
      render: (row) => (
        <div>
          <p className="text-sm">{row.reference_number}</p>
          <p className="text-xs text-muted-foreground">{row.reference_type_display}</p>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Pergerakan Stok"
        description="Kartu stok (stock ledger) otomatis setiap penerimaan barang dan konfirmasi surat jalan."
      />
      <DataTable
        columns={columns}
        rows={data?.results}
        getKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyText="Belum ada pergerakan stok."
        searchable
        searchPlaceholder="Cari produk / nomor referensi…"
        page={page}
        totalPages={totalPages}
        total={data?.count}
        onPageChange={setPage}
      />
    </div>
  );
}
