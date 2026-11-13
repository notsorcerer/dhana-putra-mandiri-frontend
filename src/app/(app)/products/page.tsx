"use client";

import Link from "next/link";
import { DataTable, type Column } from "@/components/app/data-table";
import { PageHeader } from "@/components/app/page-header";
import { PeriodFilter } from "@/components/app/period-filter";
import { GradeBadge } from "@/components/app/status-badge";
import { useAuth } from "@/lib/auth";
import { num, qty, rupiah } from "@/lib/format";
import { CAN, can } from "@/lib/menu";
import { usePaginated } from "@/lib/use-api";
import type { Product } from "@/types/api";

export default function ProductsPage() {
  const { session } = useAuth();
  const canManage = can(CAN.manageProducts, session?.role);
  const showFinancial = can(CAN.viewFinancialValues, session?.role);
  const { data, loading, error, page, setPage, totalPages } =
    usePaginated<Product>("/inventory/products/");

  const columns: Column<Product>[] = [
    {
      key: "sku",
      header: "Kode",
      render: (row) => (
        <Link
          href={
            canManage
              ? `/products/${row.id}/edit`
              : `/stock-movements?product=${row.id}`
          }
          className="doc-number"
        >
          {row.sku}
        </Link>
      ),
    },
    {
      key: "name",
      header: "Varian produk",
      render: (row) =>
        `${row.brand || ""} ${row.package_size || ""} · ${row.name}`.trim(),
    },
    {
      key: "current_stock",
      header: "Stok tersedia",
      render: (row) => qty(row.current_stock),
    },
    {
      key: "uom",
      header: "Satuan",
      render: (row) => row.uom,
    },
    {
      key: "abc_class",
      header: "Prioritas",
      render: (row) => <GradeBadge grade={row.abc_class} />,
    },
    ...(showFinancial
      ? [
          {
            key: "inventory_value",
            header: "Nilai persediaan",
            render: (row: Product) =>
              row.moving_average_hpp !== undefined
                ? rupiah(num(row.current_stock) * num(row.moving_average_hpp))
                : row.selling_price !== undefined
                  ? rupiah(row.selling_price)
                  : "—",
          } satisfies Column<Product>,
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader title="Stok & Gudang">
        <PeriodFilter />
        {canManage ? (
          <Link className="button" href="/products/new">
            Tambah data
          </Link>
        ) : null}
      </PageHeader>

      <div className="tabs">
        <Link href="/products" aria-current="page">
          Persediaan
        </Link>
        <Link href="/products/abc-analysis">Analisis ABC dan risiko</Link>
        <Link href="/stock-movements">Kartu & pergerakan stok</Link>
      </div>

      <DataTable
        columns={columns}
        rows={data?.results}
        getKey={(row) => row.id}
        loading={loading}
        error={error}
        searchable
        searchPlaceholder="Cari kode atau varian produk…"
        page={page}
        totalPages={totalPages}
        total={data?.count}
        onPageChange={setPage}
      />
    </div>
  );
}
