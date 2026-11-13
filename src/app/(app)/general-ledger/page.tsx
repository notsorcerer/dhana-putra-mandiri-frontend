"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTable, type Column } from "@/components/app/data-table";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { dateId, rupiah } from "@/lib/format";
import { usePaginated } from "@/lib/use-api";
import type { GeneralLedger } from "@/types/api";

const REFERENCE_LABELS: Record<string, string> = {
  SALES_DELIVERY: "Surat Jalan",
  GOODS_RECEIPT: "Penerimaan Barang",
  DEBIT_NOTE: "Debit Note",
  PAYMENT: "Pembayaran Kas/Bank",
  PAYROLL: "Payroll",
  MANUAL: "Penyesuaian Manual",
};

export default function GeneralLedgerPage() {
  const { data, loading, error, page, setPage, totalPages } = usePaginated<GeneralLedger>(
    "/finance/general-ledger/",
  );
  const [detail, setDetail] = useState<GeneralLedger | null>(null);

  const columns: Column<GeneralLedger>[] = [
    {
      key: "entry_number",
      header: "Nomor Jurnal",
      render: (row) => (
        <button
          type="button"
          onClick={() => setDetail(row)}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {row.entry_number}
        </button>
      ),
    },
    {
      key: "transaction_date",
      header: "Tanggal",
      render: (row) => dateId(row.transaction_date),
    },
    {
      key: "reference_type",
      header: "Sumber",
      render: (row) => (
        <div className="text-sm">
          <p>{REFERENCE_LABELS[row.reference_type] ?? row.reference_type}</p>
          {row.reference_id ? (
            <p className="text-xs text-muted-foreground">Ref #{row.reference_id}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "description",
      header: "Deskripsi",
      render: (row) => <span className="text-sm">{row.description || "-"}</span>,
    },
    {
      key: "total_debit",
      header: "Total Debit",
      className: "text-right",
      render: (row) => <span className="tabular-nums">{rupiah(row.total_debit)}</span>,
    },
    {
      key: "total_credit",
      header: "Total Kredit",
      className: "text-right",
      render: (row) => <span className="tabular-nums">{rupiah(row.total_credit)}</span>,
    },
    {
      key: "is_balanced",
      header: "Balance",
      render: (row) =>
        row.is_balanced ? (
          <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
            Seimbang
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            Tidak seimbang
          </span>
        ),
    },
    {
      key: "detail",
      header: "",
      render: (row) => (
        <Button variant="ghost" size="icon-sm" onClick={() => setDetail(row)} aria-label="Lihat baris jurnal">
          <BookOpen />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Buku Besar (General Ledger)"
        description="Seluruh jurnal otomatis dari konfirmasi dokumen, pembayaran, debit note, dan payroll. Klik nomor jurnal untuk melihat baris debit/kredit."
      />
      <DataTable
        columns={columns}
        rows={data?.results}
        getKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyText="Belum ada jurnal tercatat."
        searchable
        searchPlaceholder="Cari nomor jurnal / deskripsi…"
        page={page}
        totalPages={totalPages}
        total={data?.count}
        onPageChange={setPage}
      />

      <Dialog open={detail !== null} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Jurnal {detail?.entry_number}</DialogTitle>
            <DialogDescription>
              {detail ? `${dateId(detail.transaction_date)} · ${REFERENCE_LABELS[detail.reference_type] ?? detail.reference_type} · ${detail.description || "-"}` : ""}
            </DialogDescription>
          </DialogHeader>
          {detail ? (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Akun</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Kredit</TableHead>
                    <TableHead>Memo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <p className="font-medium">{line.account_name}</p>
                        <p className="text-xs text-muted-foreground">{line.account_code}</p>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {Number(line.debit) > 0 ? rupiah(line.debit) : "-"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {Number(line.credit) > 0 ? rupiah(line.credit) : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{line.memo || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
          {detail ? (
            <p className="text-right text-sm text-muted-foreground">
              Total: <span className="font-medium text-foreground">D {rupiah(detail.total_debit)}</span> ={" "}
              <span className="font-medium text-foreground">K {rupiah(detail.total_credit)}</span>
              {" · "}
              <StatusBadge status={detail.is_balanced ? "confirmed" : "cancelled"} fallback={detail.is_balanced ? "Seimbang" : "Tidak Seimbang"} />
            </p>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
