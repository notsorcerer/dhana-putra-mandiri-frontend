"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DataTable, type Column } from "@/components/app/data-table";
import { PageHeader } from "@/components/app/page-header";
import { PeriodFilter } from "@/components/app/period-filter";
import { StatusBadge } from "@/components/app/status-badge";
import { useAuth } from "@/lib/auth";
import { dateId, num, qty } from "@/lib/format";
import { CAN, can } from "@/lib/menu";
import { usePaginated } from "@/lib/use-api";
import type { Delivery } from "@/types/api";

export default function DeliveriesPage() {
  const { session } = useAuth();
  const canCreate = can(CAN.createDelivery, session?.role);
  const { data, loading, error, page, setPage, totalPages } =
    usePaginated<Delivery>("/inventory/deliveries/");
  const [statusFilter, setStatusFilter] = useState("");

  const rows = useMemo(() => {
    const list = data?.results ?? [];
    if (!statusFilter) return list;
    return list.filter((r) => r.status === statusFilter);
  }, [data, statusFilter]);

  const columns: Column<Delivery>[] = [
    {
      key: "delivery_number",
      header: "Dokumen",
      render: (row) => (
        <Link href={`/deliveries/${row.id}`} className="doc-number">
          {row.delivery_number}
        </Link>
      ),
    },
    {
      key: "customer_name",
      header: "Tujuan",
      render: (row) => row.customer_name || "Internal",
    },
    {
      key: "delivery_date",
      header: "Tanggal",
      render: (row) => dateId(row.delivery_date),
    },
    {
      key: "load",
      header: "Muatan",
      render: (row) => {
        if (!row.items || row.items.length === 0) return `${row.items?.length ?? 0} baris`;
        const units = new Map<string, number>();
        for (const item of row.items) {
          const u = item.product_uom || "unit";
          units.set(u, (units.get(u) ?? 0) + num(item.qty_delivered || item.qty));
        }
        return Array.from(units.entries())
          .map(([u, q]) => `${qty(q)} ${u}`)
          .join(", ");
      },
    },
    {
      key: "status",
      header: "Status serah terima",
      render: (row) => (
        <span
          className="status-chip"
          data-tone={row.status === "confirmed" ? "positive" : "warning"}
        >
          {row.status === "confirmed" ? "Diserahkan" : "Menunggu penyerahan"}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Pengiriman">
        <PeriodFilter />
        {canCreate ? (
          <Link className="button" href="/deliveries/new">
            Buat pengiriman
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
              <option value="draft">Menunggu penyerahan</option>
              <option value="confirmed">Diserahkan</option>
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
