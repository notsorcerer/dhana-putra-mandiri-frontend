"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Lock, LockOpen, Loader2, Send } from "lucide-react";
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
import { DataTable, type Column } from "@/components/app/data-table";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { ApiError, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { dateTimeId } from "@/lib/format";
import { CAN, can } from "@/lib/menu";
import { usePaginated } from "@/lib/use-api";
import type { AccountingPeriod } from "@/types/api";

type PeriodAction = "close_period" | "reopen_period" | "submit_period";

export default function AccountingPeriodsPage() {
  const { session } = useAuth();
  const canManage = can(CAN.managePeriods, session?.role);
  const { data, loading, error, page, setPage, totalPages, reload } = usePaginated<AccountingPeriod>(
    "/finance/accounting-periods/",
  );

  const [action, setAction] = useState<{ type: PeriodAction; period: AccountingPeriod } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const runAction = async () => {
    if (!action) return;
    setBusy(true);
    try {
      const body: Record<string, unknown> =
        action.type === "reopen_period" ? { reason } : {};
      await apiPost(`/finance/accounting-periods/${action.period.id}/${action.type}/`, body);
      const label =
        action.type === "close_period"
          ? "ditutup (CLOSED)"
          : action.type === "reopen_period"
            ? "dibuka kembali (OPEN)"
            : "diajukan untuk review (SUBMITTED)";
      toast.success(`Periode ${action.period.period_name} ${label}.`);
      setAction(null);
      setReason("");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal memproses aksi periode.", { duration: 8000 });
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<AccountingPeriod>[] = [
    {
      key: "period_name",
      header: "Nama Periode",
      render: (row) => <span className="font-medium">{row.period_name}</span>,
    },
    {
      key: "start_date",
      header: "Rentang",
      render: (row) => (
        <span className="text-sm whitespace-nowrap">
          {row.start_date} s.d. {row.end_date}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "closed",
      header: "Ditutup Oleh",
      render: (row) =>
        row.closed_by_name ? (
          <span className="text-sm">{`${row.closed_by_name} · ${dateTimeId(row.closed_at)}`}</span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        ),
    },
    {
      key: "reopen_reason",
      header: "Alasan Buka Ulang",
      render: (row) => <span className="text-sm text-muted-foreground">{row.reopen_reason || "-"}</span>,
    },
    ...(canManage
      ? [
          {
            key: "actions",
            header: "Aksi",
            render: (row: AccountingPeriod) => (
              <div className="flex items-center gap-1">
                {row.status === "OPEN" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAction({ type: "submit_period", period: row })}
                  >
                    <Send /> Ajukan
                  </Button>
                ) : null}
                {row.status !== "CLOSED" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAction({ type: "close_period", period: row })}
                  >
                    <Lock /> Tutup
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReason("");
                      setAction({ type: "reopen_period", period: row });
                    }}
                  >
                    <LockOpen /> Buka Ulang
                  </Button>
                )}
              </div>
            ),
          } satisfies Column<AccountingPeriod>,
        ]
      : []),
  ];

  const dialogText: Record<PeriodAction, { title: string; description: string; confirm: string }> = {
    close_period: {
      title: "Tutup Periode Akuntansi",
      description:
        "Periode yang ditutup menolak semua posting jurnal baru. Hanya dapat dibuka ulang dengan alasan.",
      confirm: "Ya, Tutup Periode",
    },
    reopen_period: {
      title: "Buka Ulang Periode",
      description:
        "Periode akan kembali berstatus OPEN. Alasan pembukaan kembali wajib diisi untuk jejak audit.",
      confirm: "Buka Ulang Periode",
    },
    submit_period: {
      title: "Ajukan Periode untuk Review",
      description:
        "Periode akan berstatus SUBMITTED dan menunggu penutupan final oleh Accounting/Direktur.",
      confirm: "Ajukan Periode",
    },
  };

  return (
    <div>
      <PageHeader
        title="Periode Akuntansi"
        description="Siklus tutup buku bulanan. Transaksi tidak dapat diposting ke periode yang berstatus CLOSED."
      />
      <DataTable
        columns={columns}
        rows={data?.results}
        getKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyText="Belum ada periode akuntansi."
        searchable
        searchPlaceholder="Cari nama periode…"
        page={page}
        totalPages={totalPages}
        total={data?.count}
        onPageChange={setPage}
      />

      <Dialog open={action !== null} onOpenChange={(open) => !open && setAction(null)}>
        <DialogContent className="max-w-md">
          {action ? (
            <>
              <DialogHeader>
                <DialogTitle>{dialogText[action.type].title}</DialogTitle>
                <DialogDescription>
                  {dialogText[action.type].description} Periode:{" "}
                  <span className="font-medium text-foreground">{action.period.period_name}</span>.
                </DialogDescription>
              </DialogHeader>
              {action.type === "reopen_period" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="reopen-reason">Alasan pembukaan kembali *</Label>
                  <Input
                    id="reopen-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Koreksi jurnal periode …"
                  />
                </div>
              ) : null}
              <DialogFooter>
                <Button variant="outline" onClick={() => setAction(null)} disabled={busy}>
                  Batal
                </Button>
                <Button onClick={runAction} disabled={busy || (action.type === "reopen_period" && reason.trim() === "")}>
                  {busy ? <Loader2 className="animate-spin" /> : null}
                  {dialogText[action.type].confirm}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
