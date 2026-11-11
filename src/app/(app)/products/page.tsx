"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, Boxes, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/app/data-table";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { useAuth } from "@/lib/auth";
import { CAN, can } from "@/lib/menu";
import { qty, rupiah } from "@/lib/format";
import { usePaginated } from "@/lib/use-api";
import type { Product } from "@/types/api";
import { ProductFormDialog } from "./product-form";

export default function ProductsPage() {
  const { session } = useAuth();
  const canManage = can(CAN.manageProducts, session?.role);
  const { data, loading, error, page, setPage, totalPages, reload } = usePaginated<Product>("/inventory/products");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const columns: Column<Product>[] = [
    {
      key: "name",
      header: "Produk",
      render: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.sku}</p>
        </div>
      ),
    },
    {
      key: "brand",
      header: "Merek",
      render: (row) => (
        <div className="text-sm">
          <p>{row.brand || "-"}</p>
          <p className="text-xs text-muted-foreground">{row.package_size || "-"}</p>
        </div>
      ),
    },
    {
      key: "current_stock",
      header: "Stok",
      render: (row) => (
        <span className="tabular-nums">
          {qty(row.current_stock)} <span className="text-xs text-muted-foreground">{row.uom}</span>
        </span>
      ),
    },
    {
      key: "moving_average_hpp",
      header: "HPP Rata-rata",
      render: (row) => (row.moving_average_hpp !== undefined ? rupiah(row.moving_average_hpp) : "-"),
    },
    {
      key: "selling_price",
      header: "Harga Jual",
      render: (row) => (row.selling_price !== undefined ? rupiah(row.selling_price) : "-"),
    },
    {
      key: "abc_class",
      header: "ABC",
      render: (row) => <StatusBadge status={row.abc_class} />,
    },
    {
      key: "estimated_stock_days",
      header: "Estimasi Stok",
      render: (row) =>
        row.is_stock_below_28_days ? (
          <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium tabular-nums text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
            {qty(row.estimated_stock_days)} hari
          </span>
        ) : (
          <span className="tabular-nums text-muted-foreground">{qty(row.estimated_stock_days)} hari</span>
        ),
    },
    ...(canManage
      ? [
          {
            key: "actions",
            header: "",
            render: (row: Product) => (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Ubah produk"
                onClick={() => {
                  setEditing(row);
                  setDialogOpen(true);
                }}
              >
                <Pencil />
              </Button>
            ),
          } satisfies Column<Product>,
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Produk"
        description="Master data produk minyak goreng beserta stok, HPP rata-rata bergerak, dan klasifikasi ABC."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/products/abc-analysis">
            <BarChart3 /> Analisis ABC
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/products/stock-estimation">
            <Boxes /> Estimasi Stok
          </Link>
        </Button>
        {canManage ? (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus /> Tambah Produk
          </Button>
        ) : null}
      </PageHeader>

      <DataTable
        columns={columns}
        rows={data?.results}
        getKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyText="Belum ada produk terdaftar."
        searchable
        searchPlaceholder="Cari produk (halaman ini)…"
        page={page}
        totalPages={totalPages}
        total={data?.count}
        onPageChange={setPage}
      />

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        product={editing}
        onSaved={reload}
      />
    </div>
  );
}

