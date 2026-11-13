"use client";

import { useMemo, useState } from "react";
import { SvgIcon } from "@/components/app/svg-sprites";

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  getKey: (row: T) => string | number;
  loading?: boolean;
  error?: string | null;
  emptyText?: string;
  /** Aktifkan pencarian sisi-klien pada halaman aktif. */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Slot filter tambahan di toolbar (mis. pilihan status). */
  toolbar?: React.ReactNode;
  /** Navigasi halaman server-side (DRF ?page=N, 20 baris/halaman). */
  page?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  /** Jumlah baris per halaman, untuk label rentang. */
  pageSize?: number;
}

/**
 * Tabel data standar aplikasi, paritas penuh dengan templates/table.html:
 * - form.table-tools (input#find-doc + select filter + button Terapkan)
 * - div.scroll > table
 * - td.empty-state (svg#doc + b "Belum ada data" + keterangan)
 * - footer.pagination ("X–Y dari Z baris" + tombol .outline Sebelumnya / Berikutnya)
 */
export function DataTable<T>({
  columns,
  rows,
  getKey,
  loading = false,
  error = null,
  emptyText = "Periksa filter atau tanggal yang dipilih.",
  searchable = false,
  searchPlaceholder = "Cari nomor dokumen atau mitra…",
  toolbar,
  page,
  totalPages,
  total,
  onPageChange,
  pageSize = 20,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!rows) return [];
    if (!query.trim()) return rows;
    const needle = query.trim().toLowerCase();
    return rows.filter((row) =>
      columns.some((col) => {
        const raw = col.render
          ? extractText(col.render(row))
          : (row as Record<string, unknown>)[col.key];
        return String(raw ?? "").toLowerCase().includes(needle);
      }),
    );
  }, [rows, query, columns]);

  const currentPage = page ?? 1;
  const totalCount = query.trim() ? filtered.length : (total ?? filtered.length);
  const rangeStart =
    totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const rangeEnd =
    totalCount > 0
      ? Math.min((currentPage - 1) * pageSize + filtered.length, totalCount)
      : 0;
  const hasPrevious = Boolean(onPageChange && currentPage > 1);
  const hasNext = Boolean(
    onPageChange && totalPages && currentPage < totalPages,
  );

  return (
    <section className="panel data-panel">
      {searchable || toolbar ? (
        <form
          className="table-tools"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          {searchable ? (
            <>
              <label className="sr-only" htmlFor="find-doc">
                Cari dokumen atau mitra
              </label>
              <input
                id="find-doc"
                name="q"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </>
          ) : null}
          {toolbar}
          <button type="submit">Terapkan</button>
        </form>
      ) : null}

      <div className="scroll">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} scope="col" className={col.className}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="empty-state">
                  Memuat data…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={columns.length} className="errorlist">
                  {error}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="empty-state">
                  <SvgIcon name="doc" />
                  <b>Belum ada data</b>
                  {emptyText}
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={getKey(row)}>
                  {columns.map((col) => (
                    <td key={col.key} className={col.className}>
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <footer className="pagination">
        <span>
          {totalCount > 0
            ? `${rangeStart}–${rangeEnd} dari ${totalCount} baris`
            : "0 baris"}
        </span>
        <div>
          {hasPrevious ? (
            <button
              type="button"
              className="outline"
              disabled={loading}
              onClick={() => onPageChange?.(currentPage - 1)}
            >
              ← Sebelumnya
            </button>
          ) : null}
          {hasNext ? (
            <button
              type="button"
              className="outline"
              disabled={loading}
              onClick={() => onPageChange?.(currentPage + 1)}
            >
              Berikutnya →
            </button>
          ) : null}
        </div>
      </footer>
    </section>
  );
}

/** Mengambil teks kasar dari hasil render kolom agar bisa dicari. */
function extractText(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join(" ");
  const element = node as unknown as { props?: { children?: React.ReactNode } };
  if (typeof element === "object" && element !== null && "props" in element) {
    return extractText(element.props?.children);
  }
  return "";
}
