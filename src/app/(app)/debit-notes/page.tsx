"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/app/data-table";
import { PageHeader } from "@/components/app/page-header";
import { PeriodFilter } from "@/components/app/period-filter";
import { StatusBadge } from "@/components/app/status-badge";
import { ApiError, apiPost, fetchAllPages } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { dateId, rupiah, suggestDocNumber, todayIso } from "@/lib/format";
import { CAN, can } from "@/lib/menu";
import { usePaginated } from "@/lib/use-api";
import type { DebitNote, GoodsReceipt } from "@/types/api";

export default function DebitNotesPage() {
  const { session } = useAuth();
  const canCreate = can(CAN.createDebitNote, session?.role);
  const canApprove =
    session?.role === "direktur" || session?.role === "accounting";
  const canApply =
    session?.role === "direktur" ||
    session?.role === "kasir" ||
    session?.role === "admin";
  const { data, loading, error, page, setPage, totalPages, reload } =
    usePaginated<DebitNote>("/finance/debit-notes/");

  const [showForm, setShowForm] = useState(false);
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    debit_note_number: suggestDocNumber("DN"),
    goods_receipt: "",
    supplier: "",
    supplier_name: "",
    date: todayIso(),
    amount: "",
    reason: "",
  });

  useEffect(() => {
    if (showForm) {
      setForm((prev) => ({ ...prev, debit_note_number: suggestDocNumber("DN") }));
      fetchAllPages<GoodsReceipt>("/inventory/goods-receipts/")
        .then((rows) => setReceipts(rows.filter((gr) => gr.has_quantity_discrepancy)))
        .catch(() => toast.error("Gagal memuat daftar penerimaan barang."));
    }
  }, [showForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        debit_note_number: form.debit_note_number,
        goods_receipt: Number(form.goods_receipt),
        ...(form.supplier !== "" ? { supplier: Number(form.supplier) } : {}),
        supplier_name: form.supplier_name,
        date: form.date,
        amount: form.amount,
        reason: form.reason,
      };
      const created = await apiPost<DebitNote>("/finance/debit-notes/", payload);
      toast.success(`Draf ${created.debit_note_number} tersimpan.`);
      setShowForm(false);
      reload();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Gagal menyimpan debit note.",
        { duration: 8000 },
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (row: DebitNote, action: "approve" | "apply") => {
    try {
      await apiPost(`/finance/debit-notes/${row.id}/${action}/`);
      toast.success(
        action === "approve"
          ? `Debit Note ${row.debit_note_number} disetujui.`
          : `Debit Note ${row.debit_note_number} diterapkan ke hutang pemasok.`,
      );
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal memproses dokumen.");
    }
  };

  const columns: Column<DebitNote>[] = [
    {
      key: "debit_note_number",
      header: "Nomor",
      render: (row) => <span className="doc-number">{row.debit_note_number}</span>,
    },
    {
      key: "date",
      header: "Tanggal",
      render: (row) => dateId(row.date),
    },
    {
      key: "kind",
      header: "Jenis",
      render: () => "Retur pemasok",
    },
    {
      key: "supplier_name",
      header: "Mitra",
      render: (row) => row.supplier_name || "Internal",
    },
    {
      key: "goods_receipt_number",
      header: "Dokumen asal",
      render: (row) =>
        row.receipt_number || row.goods_receipt_number || `#${row.goods_receipt}`,
    },
    {
      key: "amount",
      header: "Nilai (Rp)",
      render: (row) => rupiah(row.amount),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "Tindakan",
      render: (row) => (
        <div className="flex gap-1.5">
          {row.status === "draft" && canApprove ? (
            <button
              type="button"
              className="outline"
              onClick={() => handleAction(row, "approve")}
            >
              Setujui
            </button>
          ) : null}
          {row.status === "approved" && canApply ? (
            <button
              type="button"
              className="button"
              onClick={() => handleAction(row, "apply")}
            >
              Terapkan
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Retur">
        <PeriodFilter />
        {canCreate ? (
          <button
            type="button"
            className={showForm ? "outline" : "button"}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "Tutup form" : "Retur pemasok"}
          </button>
        ) : null}
      </PageHeader>

      {showForm ? (
        <form onSubmit={handleSubmit} className="panel formgrid">
          <h2 className="wide">Buat retur pemasok (Debit Note)</h2>
          <label>
            Tanggal dokumen
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
            />
          </label>
          <label>
            Dokumen asal
            <select
              required
              value={form.goods_receipt}
              onChange={(e) => {
                const grId = e.target.value;
                const gr = receipts.find((r) => String(r.id) === grId);
                setForm((p) => ({
                  ...p,
                  goods_receipt: grId,
                  supplier: gr?.supplier ? String(gr.supplier) : p.supplier,
                  supplier_name: gr?.supplier_name || p.supplier_name,
                }));
              }}
            >
              <option value="">Pilih dokumen</option>
              {receipts.map((gr) => (
                <option key={gr.id} value={gr.id}>
                  {gr.receipt_number} · {gr.supplier_name || "Internal"}
                </option>
              ))}
            </select>
          </label>
          <label>
            Nomor dokumen
            <input
              required
              value={form.debit_note_number}
              onChange={(e) =>
                setForm((p) => ({ ...p, debit_note_number: e.target.value }))
              }
            />
          </label>
          <label>
            Mitra pemasok
            <input
              required
              value={form.supplier_name}
              onChange={(e) =>
                setForm((p) => ({ ...p, supplier_name: e.target.value }))
              }
            />
          </label>
          <label className="wide">
            Nilai klaim / retur (Rp)
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              placeholder="0"
            />
          </label>
          <label className="wide">
            Catatan / alasan
            <textarea
              required
              value={form.reason}
              onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
            />
          </label>
          <div>
            <button type="submit" disabled={saving || form.goods_receipt === ""}>
              {saving ? "Menyimpan…" : "Simpan draf"}
            </button>
          </div>
        </form>
      ) : null}

      <DataTable
        columns={columns}
        rows={data?.results}
        getKey={(row) => row.id}
        loading={loading}
        error={error}
        searchable
        searchPlaceholder="Cari nomor dokumen atau mitra…"
        page={page}
        totalPages={totalPages}
        total={data?.count}
        onPageChange={setPage}
      />
    </div>
  );
}
