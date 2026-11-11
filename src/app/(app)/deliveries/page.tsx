"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/app/data-table";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { useAuth } from "@/lib/auth";
import { CAN, can } from "@/lib/menu";
import { dateId } from "@/lib/format";
import { usePaginated } from "@/lib/use-api";
import type { Delivery } from "@/types/api";

export default function DeliveriesPage() {
  const { session } = useAuth();
  const canCreate = can(CAN.createDelivery, session?.role);
  const { data, loading, error, page, setPage, totalPages } = usePaginated<Delivery>("/inventory/deliveries/");

  const columns: Column<Delivery>[] = [
    {
      key: "delivery_number",
      header: "Nomor SJ",
      render: (row) => (
        <Link href={`/deliveries/${row.id}`} className="font-medium text-primary underline-offset-4 hover:underline">
          {row.delivery_number}
        </Link>
      ),
    },
    {
      key: "customer_name",
      header: "Pelanggan",
      render: (row) => <span className="text-sm">{row.customer_name || "-"}</span>,
    },
    {
      key: "delivery_date",
      header: "Tanggal",
      render: (row) => dateId(row.delivery_date),
    },
    {
      key: "driver_name",
      header: "Pengemudi / Armada",
      render: (row) => (
        <div className="text-sm">
          <p>{row.driver_name || "-"}</p>
          <p className="text-xs text-muted-foreground">{row.vehicle_number || "-"}</p>
        </div>
      ),
    },
    {
      key: "items",
      header: "Item",
      render: (row) => `${row.items.length} baris`,
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
          <Link href={`/deliveries/${row.id}`}>
            <ArrowRight />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Surat Jalan (Pengiriman)"
        description="Dokumen pengiriman barang ke pelanggan. Konfirmasi akan memotong stok dan memposting jurnal HPP."
      >
        {canCreate ? (
          <Button size="sm" asChild>
            <Link href="/deliveries/new">
              <Plus /> Buat Surat Jalan
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
        emptyText="Belum ada dokumen pengiriman."
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
