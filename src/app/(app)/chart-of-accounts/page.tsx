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
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable, type Column } from "@/components/app/data-table";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { ApiError, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CAN, can } from "@/lib/menu";
import { usePaginated } from "@/lib/use-api";
import type { AccountType, ChartOfAccounts } from "@/types/api";

const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: "ASSET", label: "Aktiva (Aset)" },
  { value: "LIABILITY", label: "Kewajiban (Hutang)" },
  { value: "EQUITY", label: "Ekuitas (Modal)" },
  { value: "REVENUE", label: "Pendapatan" },
  { value: "COGS", label: "Beban Pokok Penjualan (HPP)" },
  { value: "EXPENSE", label: "Beban Operasional" },
];

export default function ChartOfAccountsPage() {
  const { session } = useAuth();
  const canManage = can(CAN.manageCoa, session?.role);
  const { data, loading, error, page, setPage, totalPages, reload } = usePaginated<ChartOfAccounts>(
    "/finance/chart-of-accounts/",
  );

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "",
    name: "",
    account_type: "EXPENSE" as AccountType,
    description: "",
    is_active: true,
  });

  useEffect(() => {
    if (open) {
      // Sinkronisasi nilai form saat dialog dibuka (pola disengaja).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({ code: "", name: "", account_type: "EXPENSE", description: "", is_active: true });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await apiPost<ChartOfAccounts>("/finance/chart-of-accounts/", form);
      toast.success(`Akun ${created.code} — ${created.name} berhasil ditambahkan.`);
      setOpen(false);
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal menambah akun.");
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<ChartOfAccounts>[] = [
    {
      key: "code",
      header: "Kode",
      render: (row) => <span className="font-medium tabular-nums">{row.code}</span>,
    },
    {
      key: "name",
      header: "Nama Akun",
      render: (row) => <span className="text-sm">{row.name}</span>,
    },
    {
      key: "account_type",
      header: "Tipe",
      render: (row) => <StatusBadge status={row.account_type} />,
    },
    {
      key: "description",
      header: "Deskripsi",
      render: (row) => <span className="text-sm text-muted-foreground">{row.description || "-"}</span>,
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
  ];

  return (
    <div>
      <PageHeader
        title="Bagan Akun (Chart of Accounts)"
        description="Daftar akun buku besar yang dipakai jurnal otomatis. Accounting dan Direktur dapat menambah akun."
      >
        {canManage ? (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus /> Tambah Akun
          </Button>
        ) : null}
      </PageHeader>

      <DataTable
        columns={columns}
        rows={data?.results}
        getKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyText="Belum ada akun terdaftar."
        searchable
        searchPlaceholder="Cari kode / nama akun…"
        page={page}
        totalPages={totalPages}
        total={data?.count}
        onPageChange={setPage}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Akun</DialogTitle>
            <DialogDescription>Kode akun wajib unik dan biasanya mengikuti skema numerik yang ada.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="coa-code">Kode *</Label>
                <Input
                  id="coa-code"
                  required
                  value={form.code}
                  onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                  placeholder="6500"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="coa-type">Tipe Akun *</Label>
                <select
                  id="coa-type"
                  required
                  value={form.account_type}
                  onChange={(e) => setForm((p) => ({ ...p, account_type: e.target.value as AccountType }))}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  {ACCOUNT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="coa-name">Nama Akun *</Label>
                <Input
                  id="coa-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Beban Sewa Gudang"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coa-desc">Deskripsi</Label>
              <Textarea
                id="coa-desc"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="coa-active"
                checked={form.is_active}
                onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v === true }))}
              />
              <Label htmlFor="coa-active" className="font-normal">
                Akun aktif
              </Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="animate-spin" /> : null}
                Tambah Akun
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
