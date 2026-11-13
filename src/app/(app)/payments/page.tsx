"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/app/data-table";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { useAuth } from "@/lib/auth";
import { CAN, can } from "@/lib/menu";
import { dateId, rupiah } from "@/lib/format";
import { usePaginated } from "@/lib/use-api";
import type { Payment } from "@/types/api";

export default function PaymentsPage() {
  const { session } = useAuth();
  const canCreate = can(CAN.createPayment, session?.role);
  const { data, loading, error, page, setPage, totalPages } = usePaginated<Payment>("/finance/payments/");

  const columns: Column<Payment>[] = [
    {
      key: "payment_number",
      header: "Nomor BKM/BKK",
      render: (row) => <span className="font-medium">{row.payment_number}</span>,
    },
    {
      key: "category",
      header: "Kategori",
      render: (row) => <StatusBadge status={row.category} />,
    },
    {
      key: "party",
      header: "Pihak Terkait",
      render: (row) => (
        <span className="text-sm">{row.customer_name_display || row.supplier_name_display || "-"}</span>
      ),
    },
    {
      key: "payment_type",
      header: "Metode",
      render: (row) => <StatusBadge status={row.payment_type} />,
    },
    {
      key: "cash_bank_account",
      header: "Akun Kas/Bank",
      render: (row) => (
        <span className="text-sm tabular-nums">
          {row.cash_bank_account_code} · {row.cash_bank_account_name}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Jumlah",
      className: "text-right",
      render: (row) => <span className="font-medium tabular-nums">{rupiah(row.amount)}</span>,
    },
    {
      key: "payment_date",
      header: "Tanggal",
      render: (row) => dateId(row.payment_date),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Pembayaran Kas & Bank"
        description="Bukti Kas Masuk (BKM) dan Bukti Kas Keluar (BKK). Setiap pembayaran memposting jurnal otomatis ke akun terkait."
      >
        {canCreate ? (
          <Button size="sm" asChild>
            <Link href="/payments/new">
              <Plus /> Buat Pembayaran
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
        emptyText="Belum ada pembayaran tercatat."
        searchable
        searchPlaceholder="Cari nomor / pihak terkait…"
        page={page}
        totalPages={totalPages}
        total={data?.count}
        onPageChange={setPage}
      />
    </div>
  );
}
