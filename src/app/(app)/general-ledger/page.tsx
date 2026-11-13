"use client";

import { useState } from "react";
import Link from "next/link";
import { DataTable, type Column } from "@/components/app/data-table";
import { PageHeader } from "@/components/app/page-header";
import { PeriodFilter } from "@/components/app/period-filter";
import { dateId, rupiah } from "@/lib/format";
import { usePaginated } from "@/lib/use-api";
import type { GeneralLedger } from "@/types/api";

const REFERENCE_LABELS: Record<string, string> = {
  SALES_DELIVERY: "Surat Jalan",
  GOODS_RECEIPT: "Penerimaan Barang",
  DEBIT_NOTE: "Debit Note",
  PAYMENT: "Mutasi Kas/Bank",
  PAYROLL: "Payroll",
  MANUAL: "Penyesuaian Manual",
};

export default function GeneralLedgerPage() {
  const { data, loading, error, page, setPage, totalPages } =
    usePaginated<GeneralLedger>("/finance/general-ledger/");
  const [selected, setSelected] = useState<GeneralLedger | null>(null);

  const columns: Column<GeneralLedger>[] = [
    {
      key: "entry_number",
      header: "Dokumen",
      render: (row) => (
        <a
          href="#jurnal-detail"
          className="doc-number"
          onClick={(e) => {
            e.preventDefault();
            setSelected(row);
          }}
        >
          {row.entry_number}
        </a>
      ),
    },
    {
      key: "transaction_date",
      header: "Tanggal",
      render: (row) => dateId(row.transaction_date),
    },
    {
      key: "reference_type",
      header: "Aktivitas",
      render: (row) => REFERENCE_LABELS[row.reference_type] ?? row.reference_type,
    },
    {
      key: "description",
      header: "Keterangan",
      render: (row) => row.description || "—",
    },
    {
      key: "total_debit",
      header: "Debit (Rp)",
      render: (row) => rupiah(row.total_debit),
    },
    {
      key: "total_credit",
      header: "Kredit (Rp)",
      render: (row) => rupiah(row.total_credit),
    },
    {
      key: "is_balanced",
      header: "Status",
      render: (row) => (
        <span
          className="status-chip"
          data-tone={row.is_balanced ? "positive" : "danger"}
        >
          {row.is_balanced ? "Dibukukan" : "Selisih"}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Jejak jurnal & buku besar">
        <PeriodFilter />
      </PageHeader>

      <div className="tabs">
        <Link href="/payments">Kas & bank</Link>
        <Link href="/general-ledger" aria-current="page">
          Jurnal & buku besar
        </Link>
        <Link href="/chart-of-accounts">Bagan akun (COA)</Link>
      </div>

      {selected ? (
        <section id="jurnal-detail" className="panel scroll accounting">
          <div className="panelhead">
            <div>
              <small>RINCIAN JURNAL TRANSAKSI</small>
              <h2>
                {selected.entry_number} · {dateId(selected.transaction_date)}
              </h2>
              <p>
                {REFERENCE_LABELS[selected.reference_type] ?? selected.reference_type} ·{" "}
                {selected.description || "Tanpa keterangan"}
              </p>
            </div>
            <button
              type="button"
              className="outline"
              onClick={() => setSelected(null)}
            >
              Tutup rincian
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Akun</th>
                <th>Debit (+)</th>
                <th>Kredit (−)</th>
                <th>Memo</th>
              </tr>
            </thead>
            <tbody>
              {selected.lines.map((line) => (
                <tr key={line.id}>
                  <td>
                    {line.account_code} · {line.account_name}
                  </td>
                  <td>{Number(line.debit) > 0 ? rupiah(line.debit) : "—"}</td>
                  <td>{Number(line.credit) > 0 ? rupiah(line.credit) : "—"}</td>
                  <td>{line.memo || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      <DataTable
        columns={columns}
        rows={data?.results}
        getKey={(row) => row.id}
        loading={loading}
        error={error}
        searchable
        searchPlaceholder="Cari nomor jurnal atau keterangan…"
        page={page}
        totalPages={totalPages}
        total={data?.count}
        onPageChange={setPage}
      />
    </div>
  );
}
