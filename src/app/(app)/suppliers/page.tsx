"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/app/data-table";
import { PageHeader } from "@/components/app/page-header";
import { useAuth } from "@/lib/auth";
import { CAN, can } from "@/lib/menu";
import { usePaginated } from "@/lib/use-api";
import type { Supplier } from "@/types/api";
import { SupplierFormDialog } from "./supplier-form";

export default function SuppliersPage() {
  const { session } = useAuth();
  const canManage = can(CAN.manageMasterData, session?.role);
  const { data, loading, error, page, setPage, totalPages, reload } = usePaginated<Supplier>(
    "/finance/suppliers/",
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  const columns: Column<Supplier>[] = [
    {
      key: "code",
      header: "Kode",
      render: (row) => <span className="font-medium">{row.code}</span>,
    },
    {
      key: "name",
      header: "Nama Pemasok",
      render: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.contact_person || "-"}</p>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Telepon",
      render: (row) => row.phone || "-",
    },
    {
      key: "email",
      header: "Email",
      render: (row) => row.email || "-",
    },
    {
      key: "is_active",
      header: "Status",
      render: (row) =>
        row.is_active ? (
          <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
            Aktif
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
            Nonaktif
          </span>
        ),
    },
    ...(canManage
      ? [
          {
            key: "actions",
            header: "",
            render: (row: Supplier) => (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Ubah pemasok"
                onClick={() => {
                  setEditing(row);
                  setDialogOpen(true);
                }}
              >
                <Pencil />
              </Button>
            ),
          } satisfies Column<Supplier>,
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Pemasok"
        description="Master data pemasok minyak goreng (principal). Hanya Direktur yang dapat mengubah data."
      >
        {canManage ? (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus /> Tambah Pemasok
          </Button>
        ) : null}
      </PageHeader>

      <DataTable
        columns={columns}
        rows={data?.results}
        getKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyText="Belum ada pemasok terdaftar."
        searchable
        searchPlaceholder="Cari kode / nama pemasok…"
        page={page}
        totalPages={totalPages}
        total={data?.count}
        onPageChange={setPage}
      />

      <SupplierFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        supplier={editing}
        onSaved={reload}
      />
    </div>
  );
}
