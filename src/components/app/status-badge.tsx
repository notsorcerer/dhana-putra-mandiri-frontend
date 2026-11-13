import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusStyle {
  label: string;
  className: string;
}

/**
 * Peta status dokumen backend -> label Indonesia + warna badge.
 * Status yang tidak dikenal ditampilkan apa adanya (badge netral).
 */
const STATUS_MAP: Record<string, StatusStyle> = {
  // Dokumen inventori
  draft: { label: "Draft", className: "border-border text-muted-foreground" },
  confirmed: { label: "Dikonfirmasi", className: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300" },
  // Faktur penjualan
  unpaid: { label: "Belum Dibayar", className: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300" },
  partially_paid: { label: "Dibayar Sebagian", className: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300" },
  paid: { label: "Lunas", className: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300" },
  cancelled: { label: "Dibatalkan", className: "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300" },
  // Debit note / pembayaran
  approved: { label: "Disetujui", className: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300" },
  applied: { label: "Diterapkan", className: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300" },
  completed: { label: "Selesai", className: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300" },
  // Periode akuntansi
  OPEN: { label: "Terbuka", className: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300" },
  SUBMITTED: { label: "Menunggu Review", className: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300" },
  CLOSED: { label: "Ditutup", className: "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300" },
  // Pergerakan stok
  IN: { label: "Masuk", className: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300" },
  OUT: { label: "Keluar", className: "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300" },
  // Kelas ABC
  A: { label: "Kelas A", className: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300" },
  B: { label: "Kelas B", className: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300" },
  C: { label: "Kelas C", className: "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300" },
  // Tipe akun COA
  ASSET: { label: "Aktiva", className: "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300" },
  LIABILITY: { label: "Kewajiban", className: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300" },
  EQUITY: { label: "Modal", className: "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300" },
  REVENUE: { label: "Pendapatan", className: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300" },
  COGS: { label: "HPP", className: "border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300" },
  EXPENSE: { label: "Beban", className: "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300" },
  // Tipe pembayaran
  cash: { label: "Kas Tunai", className: "border-border text-foreground" },
  bank_transfer: { label: "Transfer Bank", className: "border-border text-foreground" },
  giro: { label: "Giro / Cek", className: "border-border text-foreground" },
  // Kategori pembayaran
  customer_receipt: { label: "Penerimaan Piutang", className: "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300" },
  supplier_payment: { label: "Pembayaran Hutang", className: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300" },
  payroll: { label: "Pembayaran Gaji", className: "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300" },
  operational_expense: { label: "Beban Operasional", className: "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300" },
  other: { label: "Lain-lain", className: "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300" },
  // Tipe mutasi karyawan
  PROMOTION: { label: "Promosi Jabatan", className: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300" },
  DEMOTION: { label: "Demosi Jabatan", className: "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300" },
  DEPARTMENT_TRANSFER: { label: "Mutasi Departemen", className: "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300" },
  SALARY_ADJUSTMENT: { label: "Penyesuaian Gaji", className: "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300" },
  STATUS_CHANGE: { label: "Perubahan Status", className: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300" },
  // Tipe catatan kerja
  ATTENDANCE_NOTE: { label: "Catatan Kehadiran", className: "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300" },
  OVERTIME_LOG: { label: "Catatan Lembur", className: "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300" },
  INCIDENT: { label: "Insiden Kerja", className: "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300" },
  WARNING_LETTER: { label: "Surat Peringatan", className: "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300" },
  COMMENDATION: { label: "Apresiasi / Prestasi", className: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300" },
  GENERAL: { label: "Catatan Umum", className: "border-border text-muted-foreground" },
  // Departemen karyawan
  direksi: { label: "Direksi", className: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300" },
  sales: { label: "Sales & Marketing", className: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300" },
  gudang: { label: "Gudang & Logistik", className: "border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300" },
  finance: { label: "Finance (Kasir)", className: "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300" },
  accounting: { label: "Accounting & Pajak", className: "border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-300" },
  general: { label: "Umum & Operasional", className: "border-border text-muted-foreground" },
};

export function StatusBadge({ status, fallback }: { status?: string | null; fallback?: string }) {
  if (!status) {
    return <Badge variant="outline">{fallback ?? "-"}</Badge>;
  }
  const style = STATUS_MAP[status];
  if (!style) {
    return <Badge variant="outline">{status}</Badge>;
  }
  return (
    <Badge variant="outline" className={cn("font-medium", style.className)}>
      {style.label}
    </Badge>
  );
}

export function statusLabel(status?: string | null): string {
  if (!status) return "-";
  return STATUS_MAP[status]?.label ?? status;
}
