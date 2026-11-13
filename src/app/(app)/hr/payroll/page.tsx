"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DataTable, type Column } from "@/components/app/data-table";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge, statusLabel } from "@/components/app/status-badge";
import { ApiError, apiPost, fetchAllPages } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { MONTHS_ID, dateId, rupiah, suggestDocNumber, todayIso } from "@/lib/format";
import { CAN, can, type Role } from "@/lib/menu";
import { usePaginated } from "@/lib/use-api";
import type { ChartOfAccounts, Employee, Payment, PayrollSlip } from "@/types/api";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  approved: "Disetujui",
  paid: "Dibayar",
};

const HR_TABS: { href: string; label: string; roles: readonly Role[] }[] = [
  { href: "/hr/payroll", label: "Payroll & fee", roles: CAN.viewPayroll },
  { href: "/hr/employees", label: "Data pegawai", roles: CAN.viewEmployees },
  { href: "/hr/mutations", label: "Mutasi karyawan", roles: CAN.viewHrOps },
  { href: "/hr/labor-records", label: "Catatan kerja", roles: CAN.viewLaborRecords },
];

export default function PayrollPage() {
  const { session } = useAuth();
  const canGenerate = can(CAN.generatePayroll, session?.role);
  const canApprove = can(CAN.approvePayroll, session?.role);
  const canDisburse = can(CAN.disbursePayroll, session?.role);
  const { data, loading, error, page, setPage, totalPages, reload } = usePaginated<PayrollSlip>(
    "/hr/payroll-slips/",
  );

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccounts[]>([]);
  const [saving, setSaving] = useState(false);

  const [generateOpen, setGenerateOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [genForm, setGenForm] = useState({
    employee: "",
    period_month: String(new Date().getMonth() + 1),
    period_year: String(new Date().getFullYear()),
    overtime_allowance: "0.00",
    bonus_allowance: "0.00",
    deductions: "0.00",
    notes: "",
  });

  const [disburseTarget, setDisburseTarget] = useState<PayrollSlip | null>(null);
  const [disburseAccount, setDisburseAccount] = useState("");
  const visibleTabs = HR_TABS.filter((tab) => can(tab.roles, session?.role));

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
        .then((rows) => {
          const cashBank = rows.filter((acc) => {
            if (acc.is_cash_bank) return true;
            const code = acc.account_code ?? acc.code ?? "";
            return (
              acc.account_type === "ASSET" &&
              code.startsWith("11") &&
              code !== "1130" &&
              code !== "1140"
            );
          });
          setAccounts(cashBank);
          if (cashBank.length > 0) {
            setDisburseAccount(String(cashBank[0].id));
          }
        })
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

  const handleBatchGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiPost<{ generated_count: number; skipped_count: number }>(
        "/hr/payroll-slips/generate_monthly/",
        {
          period_month: Number(genForm.period_month),
          period_year: Number(genForm.period_year),
        },
      );
      toast.success(
        `Payroll bulanan dibuat: ${res.generated_count} slip baru (${res.skipped_count} dilewati).`,
      );
      setBatchOpen(false);
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal generate payroll bulanan.", {
        duration: 8000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (slip: PayrollSlip) => {
    try {
      await apiPost<PayrollSlip>(`/hr/payroll-slips/${slip.id}/approve/`);
      toast.success(
        `Slip ${slip.slip_number} (${slip.employee_name}) disetujui & jurnal akrual beban gaji diposting.`,
      );
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal menyetujui slip gaji.");
    }
  };

  const handleDisburse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disburseTarget) return;
    setSaving(true);
    try {
      await apiPost<Payment>("/finance/payments/", {
        payment_number: suggestDocNumber("BKK"),
        category: "payroll",
        payroll_slip: disburseTarget.id,
        cash_bank_account: Number(disburseAccount),
        payment_date: todayIso(),
        payment_method: "bank_transfer",
        payment_type: "bank_transfer",
        amount: disburseTarget.net_salary,
        notes: `Pembayaran gaji ${disburseTarget.slip_number} - ${disburseTarget.employee_name}`,
      });
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
      render: (row) => <strong className="tabular-nums">{row.slip_number}</strong>,
    },
    {
      key: "employee_name",
      header: "Karyawan",
      render: (row) => (
        <div>
          <strong>{row.employee_name}</strong>
          <div className="text-xs text-muted-foreground">
            {row.employee_nik ?? row.employee_code ?? "-"}
            {row.department ? ` · ${statusLabel(row.department)}` : ""}
          </div>
        </div>
      ),
    },
    {
      key: "period",
      header: "Periode",
      render: (row) => (
        <span className="whitespace-nowrap">
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
      render: (row) => <strong className="tabular-nums">{rupiah(row.net_salary)}</strong>,
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
      render: (row) => (
        <div className="flex gap-1.5">
          {canApprove && row.status === "draft" ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => handleApprove(row)}
            >
              Setujui
            </Button>
          ) : null}
          {canDisburse && row.status === "approved" ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setDisburseTarget(row)}
            >
              Bayarkan
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="SUMBER DAYA MANUSIA"
        title="Payroll & slip gaji"
        description="Slip gaji bulanan karyawan (Two-Stage Payroll): 1) Generate slip oleh Accounting/Direktur, 2) Setujui oleh Direktur (akrual beban gaji), 3) Bayarkan oleh Kasir/Direktur."
      >
        {canGenerate ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setGenerateOpen(false);
                setBatchOpen((v) => !v);
              }}
            >
              {batchOpen ? "Tutup Batch" : "Generate Bulanan"}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setBatchOpen(false);
                setGenerateOpen((v) => !v);
              }}
            >
              {generateOpen ? "Tutup Form" : "+ Generate Slip Gaji"}
            </Button>
          </div>
        ) : null}
      </PageHeader>

      <nav className="tabs" aria-label="Tampilan halaman">
        {visibleTabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={tab.href === "/hr/payroll" ? "page" : undefined}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {batchOpen && canGenerate ? (
        <form onSubmit={handleBatchGenerate} className="panel formgrid mb-4">
          <div className="panelhead wide">
            <div>
              <h2>Generate payroll bulanan (seluruh karyawan aktif)</h2>
              <p>
                Membuat draf slip gaji otomatis untuk seluruh karyawan aktif termasuk perhitungan jam lembur pada periode tersebut.
              </p>
            </div>
          </div>

          <label htmlFor="batch-month">
            Bulan periode *
            <select
              id="batch-month"
              required
              value={genForm.period_month}
              onChange={(e) => setGenForm((p) => ({ ...p, period_month: e.target.value }))}
            >
              {MONTHS_ID.map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </label>

          <label htmlFor="batch-year">
            Tahun periode *
            <Input
              id="batch-year"
              type="number"
              min="2001"
              required
              value={genForm.period_year}
              onChange={(e) => setGenForm((p) => ({ ...p, period_year: e.target.value }))}
            />
          </label>

          <div className="form-actions wide">
            <Button type="button" variant="outline" onClick={() => setBatchOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : null}
              Generate Seluruh Karyawan
            </Button>
          </div>
        </form>
      ) : null}

      {generateOpen && canGenerate ? (
        <form onSubmit={handleGenerate} className="panel formgrid mb-4">
          <div className="panelhead wide">
            <div>
              <h2>Generate slip gaji</h2>
              <p>
                Gaji pokok dan tunjangan standar diambil dari master karyawan. Bila slip periode yang sama
                sudah ada dan belum dibayar, nilainya akan diperbarui.
              </p>
            </div>
          </div>

          <label className="wide" htmlFor="pay-employee">
            Karyawan *
            <select
              id="pay-employee"
              required
              value={genForm.employee}
              onChange={(e) => setGenForm((p) => ({ ...p, employee: e.target.value }))}
            >
              <option value="">— pilih karyawan aktif —</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.employee_id} · {employee.full_name}
                  {employee.base_salary !== undefined
                    ? ` · ${rupiah(employee.base_salary)}`
                    : ""}
                </option>
              ))}
            </select>
          </label>

          <label htmlFor="pay-month">
            Bulan periode *
            <select
              id="pay-month"
              required
              value={genForm.period_month}
              onChange={(e) => setGenForm((p) => ({ ...p, period_month: e.target.value }))}
            >
              {MONTHS_ID.map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </label>

          <label htmlFor="pay-year">
            Tahun periode *
            <Input
              id="pay-year"
              type="number"
              min="2001"
              required
              value={genForm.period_year}
              onChange={(e) => setGenForm((p) => ({ ...p, period_year: e.target.value }))}
            />
          </label>

          <label htmlFor="pay-overtime">
            Tunjangan lembur
            <Input
              id="pay-overtime"
              type="number"
              min="0"
              step="0.01"
              value={genForm.overtime_allowance}
              onChange={(e) => setGenForm((p) => ({ ...p, overtime_allowance: e.target.value }))}
            />
          </label>

          <label htmlFor="pay-bonus">
            Bonus
            <Input
              id="pay-bonus"
              type="number"
              min="0"
              step="0.01"
              value={genForm.bonus_allowance}
              onChange={(e) => setGenForm((p) => ({ ...p, bonus_allowance: e.target.value }))}
            />
          </label>

          <label htmlFor="pay-deductions">
            Potongan
            <Input
              id="pay-deductions"
              type="number"
              min="0"
              step="0.01"
              value={genForm.deductions}
              onChange={(e) => setGenForm((p) => ({ ...p, deductions: e.target.value }))}
            />
          </label>

          <label className="wide" htmlFor="pay-notes">
            Catatan
            <Textarea
              id="pay-notes"
              rows={2}
              value={genForm.notes}
              onChange={(e) => setGenForm((p) => ({ ...p, notes: e.target.value }))}
            />
          </label>

          <div className="form-actions wide">
            <Button type="button" variant="outline" onClick={() => setGenerateOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" disabled={saving || genForm.employee === ""}>
              {saving ? <Loader2 className="animate-spin" /> : null}
              Generate Slip
            </Button>
          </div>
        </form>
      ) : null}

      {disburseTarget && canDisburse ? (
        <form onSubmit={handleDisburse} className="panel formgrid mb-4">
          <div className="panelhead wide">
            <div>
              <h2>Bayarkan gaji — {disburseTarget.slip_number}</h2>
              <p>
                Gaji bersih <strong>{rupiah(disburseTarget.net_salary)}</strong> untuk{" "}
                {disburseTarget.employee_name} periode {MONTHS_ID[disburseTarget.period_month - 1]}{" "}
                {disburseTarget.period_year} akan dibayarkan dan jurnal beban gaji diposting otomatis.
              </p>
            </div>
          </div>

          <label className="wide" htmlFor="disburse-account">
            Akun kas / bank pembayaran *
            <select
              id="disburse-account"
              value={disburseAccount}
              onChange={(e) => setDisburseAccount(e.target.value)}
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_code ?? acc.code} · {acc.name}
                </option>
              ))}
            </select>
          </label>

          <div className="form-actions wide">
            <Button type="button" variant="outline" onClick={() => setDisburseTarget(null)} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" disabled={saving || disburseAccount === ""}>
              {saving ? <Loader2 className="animate-spin" /> : null}
              Bayarkan Gaji
            </Button>
          </div>
        </form>
      ) : null}

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
    </div>
  );
}
