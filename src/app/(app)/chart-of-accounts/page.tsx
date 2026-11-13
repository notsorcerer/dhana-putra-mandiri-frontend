"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
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
  { value: "EXPENSE", label: "Beban Operasional & HPP" },
];

const REPORT_GROUP_OPTIONS = [
  { value: "CURRENT_ASSET", label: "Aset Lancar (Kas, Bank, Piutang, Persediaan)" },
  { value: "FIXED_ASSET", label: "Aset Tetap (Kendaraan, Bangunan)" },
  { value: "CURRENT_LIABILITY", label: "Kewajiban Lancar (Hutang Dagang, Beban Akrual)" },
  { value: "LONG_TERM_LIABILITY", label: "Kewajiban Jangka Panjang" },
  { value: "EQUITY", label: "Ekuitas Pemilik" },
  { value: "SALES", label: "Pendapatan Penjualan" },
  { value: "COGS", label: "Harga Pokok Penjualan (HPP)" },
  { value: "LABOR_EXPENSE", label: "Beban Upah & Tenaga Kerja Gudang" },
  { value: "TRANSPORT_EXPENSE", label: "Beban Transportasi & Logistik" },
  { value: "ADMIN_EXPENSE", label: "Beban Umum & Administrasi" },
  { value: "OTHER_EXPENSE", label: "Beban / Pendapatan Lain-lain" },
  { value: "TAX_EXPENSE", label: "Beban Pajak" },
];

export default function ChartOfAccountsPage() {
  const { session } = useAuth();
  const canManage = can(CAN.manageCoa, session?.role);
  const { data, loading, error, page, setPage, totalPages, reload } =
    usePaginated<ChartOfAccounts>("/finance/chart-of-accounts/");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    account_code: "",
    name: "",
    account_type: "EXPENSE" as AccountType,
    report_group: "ADMIN_EXPENSE",
    normal_balance: "D" as "D" | "C",
    is_cash_bank: false,
    is_postable: true,
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await apiPost<ChartOfAccounts>(
        "/finance/chart-of-accounts/",
        form,
      );
      toast.success(`Akun ${created.account_code ?? created.code} · ${created.name} berhasil ditambahkan.`);
      setShowForm(false);
      setForm({
        account_code: "",
        name: "",
        account_type: "EXPENSE",
        report_group: "ADMIN_EXPENSE",
        normal_balance: "D",
        is_cash_bank: false,
        is_postable: true,
        is_active: true,
      });
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal menambah akun.");
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<ChartOfAccounts>[] = [
    {
      key: "account_code",
      header: "Kode",
      render: (row) => <span className="doc-number">{row.account_code ?? row.code}</span>,
    },
    {
      key: "name",
      header: "Nama akun",
      render: (row) => row.name,
    },
    {
      key: "account_type",
      header: "Kelompok",
      render: (row) => <StatusBadge status={row.account_type} />,
    },
    {
      key: "report_group",
      header: "Grup Laporan",
      render: (row) =>
        REPORT_GROUP_OPTIONS.find((g) => g.value === row.report_group)?.label ??
        row.report_group ??
        row.description ??
        "—",
    },
    {
      key: "normal_balance",
      header: "Saldo Normal",
      render: (row) => (row.normal_balance === "C" ? "Kredit (C)" : "Debit (D)"),
    },
    {
      key: "is_active",
      header: "Status",
      render: (row) => (
        <span
          className="status-chip"
          data-tone={row.is_active ? "positive" : undefined}
        >
          {row.is_active ? "Aktif" : "Nonaktif"}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Bagan akun">
        {canManage ? (
          <button
            type="button"
            className={showForm ? "outline" : "button"}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "Tutup form" : "Tambah data"}
          </button>
        ) : null}
      </PageHeader>

      <div className="tabs">
        <Link href="/suppliers">Pemasok</Link>
        <Link href="/customers">Pelanggan</Link>
        <Link href="/products">Produk</Link>
        <Link href="/chart-of-accounts" aria-current="page">
          Bagan akun
        </Link>
        <Link href="/hr/employees">Pegawai</Link>
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="panel formgrid">
          <h2 className="wide">Tambah bagan akun</h2>
          <label>
            Kode akun
            <input
              required
              value={form.account_code}
              onChange={(e) => setForm((p) => ({ ...p, account_code: e.target.value }))}
              placeholder="6500"
            />
          </label>
          <label>
            Kelompok akun
            <select
              required
              value={form.account_type}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  account_type: e.target.value as AccountType,
                }))
              }
            >
              {ACCOUNT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Grup laporan
            <select
              required
              value={form.report_group}
              onChange={(e) =>
                setForm((p) => ({ ...p, report_group: e.target.value }))
              }
            >
              {REPORT_GROUP_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Saldo normal
            <select
              required
              value={form.normal_balance}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  normal_balance: e.target.value as "D" | "C",
                }))
              }
            >
              <option value="D">Debit (D)</option>
              <option value="C">Kredit (C)</option>
            </select>
          </label>
          <label className="wide">
            Nama akun
            <input
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Beban Sewa Gudang"
            />
          </label>
          <div>
            <button type="submit" disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan"}
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
        searchPlaceholder="Cari kode atau nama akun…"
        page={page}
        totalPages={totalPages}
        total={data?.count}
        onPageChange={setPage}
      />
    </div>
  );
}
