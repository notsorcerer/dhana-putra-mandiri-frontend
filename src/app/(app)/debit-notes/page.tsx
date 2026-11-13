"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataTable, type Column } from "@/components/app/data-table";
import { PageHeader } from "@/components/app/page-header";
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
  const { data, loading, error, page, setPage, totalPages, reload } = usePaginated<DebitNote>(
    "/finance/debit-notes/",
  );

  const [open, setOpen] = useState(false);
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    debit_note_number: suggestDocNumber("DN"),
    goods_receipt: "",
    supplier_name: "",
    date: todayIso(),
    amount: "",
    reason: "",
  });

  useEffect(() => {
    if (open) {
      // Usulkan nomor dokumen baru setiap dialog dibuka.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm((prev) => ({ ...prev, debit_note_number: suggestDocNumber("DN") }));
      fetchAllPages<GoodsReceipt>("/inventory/goods-receipts/")
        .then((rows) => setReceipts(rows.filter((gr) => gr.has_quantity_discrepancy)))
        .catch(() => toast.error("Gagal memuat daftar penerimaan barang."));
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        debit_note_number: form.debit_note_number,
        goods_receipt: Number(form.goods_receipt),
        supplier_name: form.supplier_name,
        date: form.date,
        amount: form.amount,
        reason: form.reason,
      };
      const created = await apiPost<DebitNote>("/finance/debit-notes/", payload);
      toast.success(`Debit note ${created.debit_note_number} berhasil dibuat.`);
      setOpen(false);
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal menyimpan debit note.", { duration: 8000 });
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<DebitNote>[] = [
    {
      key: "debit_note_number",
      header: "Nomor DN",
      render: (row) => <span className="font-medium">{row.debit_note_number}</span>,
    },
    {
      key: "goods_receipt_number",
      header: "Penerimaan Terkait",
      render: (row) => row.goods_receipt_number || `#${row.goods_receipt}`,
    },
    {
      key: "supplier_name",
      header: "Pemasok",
      render: (row) => <span className="text-sm">{row.supplier_name || "-"}</span>,
    },
    {
      key: "date",
      header: "Tanggal",
      render: (row) => dateId(row.date),
    },
    {
      key: "amount",
      header: "Jumlah",
      className: "text-right",
      render: (row) => <span className="font-medium tabular-nums">{rupiah(row.amount)}</span>,
    },
    {
      key: "reason",
      header: "Alasan",
      render: (row) => <span className="text-sm text-muted-foreground">{row.reason || "-"}</span>,
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
        title="Debit Note"
        description="Klaim pengurangan hutang ke pemasok akibat selisih kuantitas atau kerusakan barang pada penerimaan barang."
      >
        {canCreate ? (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus /> Buat Debit Note
          </Button>
        ) : null}
      </PageHeader>

      <DataTable
        columns={columns}
        rows={data?.results}
        getKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyText="Belum ada debit note."
        searchable
        searchPlaceholder="Cari nomor / pemasok…"
        page={page}
        totalPages={totalPages}
        total={data?.count}
        onPageChange={setPage}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Buat Debit Note</DialogTitle>
            <DialogDescription>
              Pilih penerimaan barang yang memiliki selisih kuantitas. Periode akuntansi tanggal tersebut
              tidak boleh berstatus CLOSED.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="dn-number">Nomor Debit Note *</Label>
                <Input
                  id="dn-number"
                  required
                  value={form.debit_note_number}
                  onChange={(e) => setForm((p) => ({ ...p, debit_note_number: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dn-date">Tanggal *</Label>
                <Input
                  id="dn-date"
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="dn-gr">Penerimaan Barang (berselisih) *</Label>
                <select
                  id="dn-gr"
                  required
                  value={form.goods_receipt}
                  onChange={(e) => {
                    const grId = e.target.value;
                    const gr = receipts.find((r) => String(r.id) === grId);
                    setForm((p) => ({
                      ...p,
                      goods_receipt: grId,
                      supplier_name: gr?.supplier_name || p.supplier_name,
                    }));
                  }}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">— pilih penerimaan —</option>
                  {receipts.map((gr) => (
                    <option key={gr.id} value={gr.id}>
                      {gr.receipt_number} · {gr.supplier_name || "tanpa pemasok"}
                    </option>
                  ))}
                </select>
                {receipts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Tidak ada penerimaan barang dengan selisih kuantitas.
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dn-supplier">Nama Pemasok *</Label>
                <Input
                  id="dn-supplier"
                  required
                  value={form.supplier_name}
                  onChange={(e) => setForm((p) => ({ ...p, supplier_name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dn-amount">Jumlah *</Label>
                <Input
                  id="dn-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dn-reason">Alasan *</Label>
              <Textarea
                id="dn-reason"
                rows={2}
                required
                value={form.reason}
                onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
                placeholder="Keterangan selisih / kerusakan barang…"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Batal
              </Button>
              <Button type="submit" disabled={saving || form.goods_receipt === ""}>
                {saving ? <Loader2 className="animate-spin" /> : null}
                Buat Debit Note
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
