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
  { value: "COGS", label: "Beban Pokok Penjualan (HPP)" },
  { value: "EXPENSE", label: "Beban Operasional" },
];

export default function ChartOfAccountsPage() {
  const { session } = useAuth();
  const canManage = can(CAN.manageCoa, session?.role);
  const { data, loading, error, page, setPage, totalPages, reload } =
    usePaginated<ChartOfAccounts>("/finance/chart-of-accounts/");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "",
    name: "",
    account_type: "EXPENSE" as AccountType,
    description: "",
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
      toast.success(`Akun ${created.code} · ${created.name} berhasil ditambahkan.`);
      setShowForm(false);
      setForm({
        code: "",
        name: "",
        account_type: "EXPENSE",
        description: "",
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
      key: "code",
      header: "Kode",
      render: (row) => <span className="doc-number">{row.code}</span>,
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
      key: "description",
      header: "Deskripsi",
      render: (row) => row.description || "—",
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
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
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
          <label className="wide">
            Nama akun
            <input
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Beban Sewa Gudang"
            />
          </label>
          <label className="wide">
            Deskripsi
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
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
