/**
 * Helper format tampilan (Indonesia): angka desimal dari backend (string),
 * Rupiah, tanggal, persentase, dan usulan nomor dokumen.
 */

/** Konversi nilai desimal DRF (string "420.00") menjadi number. */
export function num(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Format Rupiah tanpa desimal, contoh: Rp 15.606.000. */
export function rupiah(value: unknown): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num(value));
}

/** Format Rupiah untuk grafik (notasi ringkas), contoh: Rp 15,6 jt. */
export function rupiahCompact(value: unknown): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num(value));
}

/** Format kuantitas maksimal 2 desimal, contoh: 420 atau 12,5. */
export function qty(value: unknown): string {
  const n = num(value);
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n);
}

/** Format persentase, contoh: 12,3%. */
export function pct(value: unknown): string {
  return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(num(value))}%`;
}

/** Format tanggal ISO menjadi "11 Nov 2026". Mengembalikan "-" bila kosong. */
export function dateId(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

/** Format datetime ISO menjadi "11 Nov 2026, 14.30". */
export function dateTimeId(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Tanggal hari ini dalam format YYYY-MM-DD (zona waktu lokal). */
export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Usulan nomor dokumen unik untuk field yang wajib diisi klien.
 * Backend sendiri memakai pola TIPE/YYYYMM/0000, namun nomor harus dikirim
 * dari frontend; gunakan akhiran WEB + stempel waktu agar unik.
 * Contoh: GR-WEB-20261111-143025.
 */
export function suggestDocNumber(prefix: string): string {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const time = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  return `${prefix}-WEB-${date}-${time}`;
}

export const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/** Daftar tahun pilihan untuk filter laporan (3 tahun ke belakang s.d. tahun ini). */
export function availableYears(): number[] {
  const current = new Date().getFullYear();
  return [current - 2, current - 1, current];
}
