"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Banknote, Loader2, Play } from "lucide-react";
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
import { MONTHS_ID, dateId, rupiah } from "@/lib/format";
import { CAN, can } from "@/lib/menu";
import { usePaginated } from "@/lib/use-api";
import type { ChartOfAccounts, Employee, PayrollSlip } from "@/types/api";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  approved: "Disetujui",
  paid: "Dibayar",
};

export default function PayrollPage() {
  const { session } = useAuth();
  const canGenerate = can(CAN.generatePayroll, session?.role);
  const canDisburse = can(CAN.disbursePayroll, session?.role);
  const { data, loading, error, page, setPage, totalPages, reload } = usePaginated<PayrollSlip>(
    "/hr/payroll-slips/",
  );

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccounts[]>([]);
  const [saving, setSaving] = useState(false);

  // Dialog generate
  const [generateOpen, setGenerateOpen] = useState(false);
  const [genForm, setGenForm] = useState({
    employee: "",
    period_month: String(new Date().getMonth() + 1),
    period_year: String(new Date().getFullYear()),
    overtime_allowance: "0.00",
    bonus_allowance: "0.00",
    deductions: "0.00",
    notes: "",
  });

  // Dialog disburse
  const [disburseTarget, setDisburseTarget] = useState<PayrollSlip | null>(null);
  const [disburseAccount, setDisburseAccount] = useState("1120");

  useEffect(() => {
    if (generateOpen) {
      fetchAllPages<Employee>("/hr/employees/")
        .then((rows) => setEmployees(rows.filter((e) => e.is_active)))
        .catch(() => toast.error("Gagal memuat daftar karyawan."));
    }
  }, [generateOpen]);

  useEffect(() => {
    if (disburseTarget) {
      fetchAllPages<ChartOfAccounts>("/finance/chart-of-accounts/")
        .then((rows) =>
          setAccounts(
            rows.filter(
              (acc) =>
                acc.account_type === "ASSET" &&
                acc.code.startsWith("11") &&
                acc.code !== "1130" &&
                acc.code !== "1140",
            ),
          ),
        )
        .catch(() => toast.error("Gagal memuat daftar akun kas/bank."));
    }
  }, [disburseTarget]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await apiPost<PayrollSlip>("/hr/payroll-slips/generate/", {
        employee: Number(genForm.employee),
        period_month: Number(genForm.period_month),
        period_year: Number(genForm.period_year),
        overtime_allowance: genForm.overtime_allowance,
        bonus_allowance: genForm.bonus_allowance,
        deductions: genForm.deductions,
        notes: genForm.notes,
      });
      toast.success(
        `Slip gaji ${created.slip_number} untuk ${created.employee_name} dibuat (${rupiah(created.net_salary)}).`,
      );
      setGenerateOpen(false);
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal membuat slip gaji.", { duration: 8000 });
    } finally {
      setSaving(false);
    }
  };

  const handleDisburse = async () => {
    if (!disburseTarget) return;
    setSaving(true);
    try {
      await apiPost<{ message: string; data: PayrollSlip }>(
        `/hr/payroll-slips/${disburseTarget.id}/disburse/`,
        { disbursement_account_code: disburseAccount },
      );
      toast.success(
        `Gaji ${disburseTarget.employee_name} periode ${MONTHS_ID[disburseTarget.period_month - 1]} ${disburseTarget.period_year} telah dibayarkan & jurnal diposting.`,
      );
      setDisburseTarget(null);
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal membayarkan gaji.", { duration: 8000 });
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<PayrollSlip>[] = [
    {
      key: "slip_number",
      header: "Nomor Slip",
      render: (row) => <span className="font-medium tabular-nums">{row.slip_number}</span>,
    },
    {
      key: "employee_name",
      header: "Karyawan",
      render: (row) => (
        <div>
          <p className="font-medium">{row.employee_name}</p>
          <p className="text-xs text-muted-foreground">
            {row.employee_code} · {row.department}
          </p>
        </div>
      ),
    },
    {
      key: "period",
      header: "Periode",
      render: (row) => (
        <span className="text-sm whitespace-nowrap">
          {MONTHS_ID[row.period_month - 1]} {row.period_year}
        </span>
      ),
    },
    {
      key: "base_salary",
      header: "Gaji Pokok",
      className: "text-right",
      render: (row) => <span className="tabular-nums">{rupiah(row.base_salary)}</span>,
    },
    {
      key: "allowances",
      header: "Tunjangan",
      className: "text-right",
      render: (row) => <span className="tabular-nums">{rupiah(row.allowances)}</span>,
    },
    {
      key: "deductions",
      header: "Potongan",
      className: "text-right",
      render: (row) => <span className="tabular-nums">{rupiah(row.deductions)}</span>,
    },
    {
      key: "net_salary",
      header: "Gaji Bersih",
      className: "text-right",
      render: (row) => <span className="font-semibold tabular-nums">{rupiah(row.net_salary)}</span>,
    },
    {
      key: "payment_date",
      header: "Tanggal Bayar",
      render: (row) => dateId(row.payment_date),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} fallback={STATUS_LABELS[row.status]} />,
    },
    {
      key: "actions",
      header: "",
      render: (row) =>
        canDisburse && row.status !== "paid" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDisburseAccount("1120");
              setDisburseTarget(row);
            }}
          >
            <Banknote /> Bayarkan
          </Button>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Payroll"
        description="Slip gaji bulanan karyawan. Generate slip oleh Accounting/Direktur; pembayaran (disburse) oleh Kasir/Direktur dan otomatis memposting jurnal beban gaji."
      >
        {canGenerate ? (
          <Button size="sm" onClick={() => setGenerateOpen(true)}>
            <Play /> Generate Slip Gaji
          </Button>
        ) : null}
      </PageHeader>

      <DataTable
        columns={columns}
        rows={data?.results}
        getKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyText="Belum ada slip gaji. Generate slip untuk memulai."
        searchable
        searchPlaceholder="Cari nomor slip / karyawan…"
        page={page}
        totalPages={totalPages}
        total={data?.count}
        onPageChange={setPage}
      />

      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Slip Gaji</DialogTitle>
            <DialogDescription>
              Gaji pokok dan tunjangan standar diambil dari master karyawan. Bila slip periode yang sama
              sudah ada dan belum dibayar, nilainya akan diperbarui.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pay-employee">Karyawan *</Label>
              <select
                id="pay-employee"
                required
                value={genForm.employee}
                onChange={(e) => setGenForm((p) => ({ ...p, employee: e.target.value }))}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="">— pilih karyawan aktif —</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.employee_id} · {employee.full_name} · {rupiah(employee.base_salary)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pay-month">Bulan Periode *</Label>
                <select
                  id="pay-month"
                  required
                  value={genForm.period_month}
                  onChange={(e) => setGenForm((p) => ({ ...p, period_month: e.target.value }))}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  {MONTHS_ID.map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pay-year">Tahun Periode *</Label>
                <Input
                  id="pay-year"
                  type="number"
                  min="2001"
                  required
                  value={genForm.period_year}
                  onChange={(e) => setGenForm((p) => ({ ...p, period_year: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pay-overtime">Tunjangan Lembur</Label>
                <Input
                  id="pay-overtime"
                  type="number"
                  min="0"
                  step="0.01"
                  value={genForm.overtime_allowance}
                  onChange={(e) => setGenForm((p) => ({ ...p, overtime_allowance: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pay-bonus">Bonus</Label>
                <Input
                  id="pay-bonus"
                  type="number"
                  min="0"
                  step="0.01"
                  value={genForm.bonus_allowance}
                  onChange={(e) => setGenForm((p) => ({ ...p, bonus_allowance: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pay-deductions">Potongan</Label>
                <Input
                  id="pay-deductions"
                  type="number"
                  min="0"
                  step="0.01"
                  value={genForm.deductions}
                  onChange={(e) => setGenForm((p) => ({ ...p, deductions: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pay-notes">Catatan</Label>
              <Textarea
                id="pay-notes"
                rows={2}
                value={genForm.notes}
                onChange={(e) => setGenForm((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGenerateOpen(false)} disabled={saving}>
                Batal
              </Button>
              <Button type="submit" disabled={saving || genForm.employee === ""}>
                {saving ? <Loader2 className="animate-spin" /> : null}
                Generate Slip
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={disburseTarget !== null} onOpenChange={(open) => !open && setDisburseTarget(null)}>
        <DialogContent className="max-w-md">
          {disburseTarget ? (
            <>
              <DialogHeader>
                <DialogTitle>Bayarkan Gaji</DialogTitle>
                <DialogDescription>
                  Gaji bersih <span className="font-semibold text-foreground">{rupiah(disburseTarget.net_salary)}</span>{" "}
                  untuk {disburseTarget.employee_name} periode{" "}
                  {MONTHS_ID[disburseTarget.period_month - 1]} {disburseTarget.period_year} akan dibayarkan dan
                  jurnal beban gaji diposting otomatis.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-1.5">
                <Label htmlFor="disburse-account">Akun Kas / Bank Pembayaran *</Label>
                <select
                  id="disburse-account"
                  value={disburseAccount}
                  onChange={(e) => setDisburseAccount(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.code}>
                      {acc.code} · {acc.name}
                    </option>
                  ))}
                  {accounts.length === 0 ? <option value="1120">1120 · Bank BCA (default)</option> : null}
                </select>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDisburseTarget(null)} disabled={saving}>
                  Batal
                </Button>
                <Button onClick={handleDisburse} disabled={saving || disburseAccount === ""}>
                  {saving ? <Loader2 className="animate-spin" /> : <Banknote />}
                  Bayarkan Gaji
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
