import { cn } from "@/lib/utils";

type Tone = "neutral" | "positive" | "warning" | "danger" | "info";

interface StatusStyle {
  label: string;
  tone: Tone;
}

/**
 * Peta status dokumen backend -> label Indonesia + nada warna chip.
 * Nada mengikuti palet prototipe lama (oranye = draf/menunggu,
 * teal = selesai/dibukukan). Status tak dikenal tampil netral.
 */
const STATUS_MAP: Record<string, StatusStyle> = {
  // Dokumen inventori
  draft: { label: "Draft", tone: "warning" },
  confirmed: { label: "Dikonfirmasi", tone: "positive" },
  // Faktur penjualan & pembayaran hutang
  unpaid: { label: "Belum Dibayar", tone: "warning" },
  partial: { label: "Dibayar Sebagian", tone: "warning" },
  partially_paid: { label: "Dibayar Sebagian", tone: "warning" },
  paid: { label: "Lunas", tone: "positive" },
  cancelled: { label: "Dibatalkan", tone: "danger" },
  // Debit note / pembayaran
  approved: { label: "Disetujui", tone: "positive" },
  applied: { label: "Diterapkan", tone: "positive" },
  completed: { label: "Selesai", tone: "positive" },
  // Periode akuntansi
  OPEN: { label: "Terbuka", tone: "positive" },
  SUBMITTED: { label: "Menunggu Review", tone: "warning" },
  CLOSED: { label: "Ditutup", tone: "danger" },
  // Pergerakan stok
  IN: { label: "Masuk", tone: "positive" },
  OUT: { label: "Keluar", tone: "warning" },
  // Kelas ABC
  A: { label: "A", tone: "warning" },
  B: { label: "B", tone: "positive" },
  C: { label: "C", tone: "neutral" },
  // Tipe akun COA
  ASSET: { label: "Aktiva", tone: "info" },
  LIABILITY: { label: "Kewajiban", tone: "warning" },
  EQUITY: { label: "Modal", tone: "info" },
  REVENUE: { label: "Pendapatan", tone: "positive" },
  COGS: { label: "HPP", tone: "warning" },
  EXPENSE: { label: "Beban", tone: "danger" },
  // Tipe pembayaran
  cash: { label: "Kas Tunai", tone: "neutral" },
  credit: { label: "Tempo / Kredit", tone: "warning" },
  bank_transfer: { label: "Transfer Bank", tone: "neutral" },
  giro: { label: "Giro / Cek", tone: "neutral" },
  // Kategori pembayaran
  customer_receipt: { label: "Penerimaan Piutang", tone: "info" },
  supplier_payment: { label: "Pembayaran Hutang", tone: "warning" },
  payroll: { label: "Pembayaran Gaji", tone: "info" },
  operational_expense: { label: "Beban Operasional", tone: "danger" },
  other: { label: "Lain-lain", tone: "neutral" },
  // Tipe mutasi karyawan
  promotion: { label: "Promosi Jabatan", tone: "positive" },
  demotion: { label: "Demosi Jabatan", tone: "danger" },
  transfer: { label: "Mutasi Departemen", tone: "info" },
  salary_adjustment: { label: "Penyesuaian Gaji", tone: "info" },
  PROMOTION: { label: "Promosi Jabatan", tone: "positive" },
  DEMOTION: { label: "Demosi Jabatan", tone: "danger" },
  DEPARTMENT_TRANSFER: { label: "Mutasi Departemen", tone: "info" },
  SALARY_ADJUSTMENT: { label: "Penyesuaian Gaji", tone: "info" },
  STATUS_CHANGE: { label: "Perubahan Status", tone: "warning" },
  // Tipe catatan kerja
  ATTENDANCE_NOTE: { label: "Catatan Kehadiran", tone: "info" },
  OVERTIME_LOG: { label: "Catatan Lembur", tone: "info" },
  INCIDENT: { label: "Insiden Kerja", tone: "danger" },
  WARNING_LETTER: { label: "Surat Peringatan", tone: "danger" },
  COMMENDATION: { label: "Apresiasi / Prestasi", tone: "positive" },
  GENERAL: { label: "Catatan Umum", tone: "neutral" },
  // Departemen karyawan
  direksi: { label: "Direksi", tone: "warning" },
  manajemen: { label: "Manajemen & Direksi", tone: "warning" },
  sales: { label: "Sales & Marketing", tone: "positive" },
  gudang: { label: "Gudang", tone: "warning" },
  logistik: { label: "Logistik & Pengiriman", tone: "warning" },
  finance: { label: "Finance (Kasir)", tone: "info" },
  accounting: { label: "Accounting & Pajak", tone: "info" },
  operasional: { label: "Operasional", tone: "neutral" },
  general: { label: "Umum & Operasional", tone: "neutral" },
};

export function GradeBadge({ grade }: { grade?: string | null }) {
  const g = (grade ?? "-").toUpperCase();
  return (
    <span className={cn("grade", g === "A" && "gradeA", g === "B" && "gradeB")}>
      {g}
    </span>
  );
}

export function StatusBadge({ status, fallback }: { status?: string | null; fallback?: string }) {
  if (!status) {
    return <span className="status-chip">{fallback ?? "-"}</span>;
  }
  if (status === "A" || status === "B" || status === "C") {
    return <GradeBadge grade={status} />;
  }
  const style = STATUS_MAP[status];
  if (!style) {
    return <span className="status-chip">{status}</span>;
  }
  return (
    <span className={cn("status-chip")} data-tone={style.tone === "neutral" ? undefined : style.tone}>
      {style.label}
    </span>
  );
}

export function statusLabel(status?: string | null): string {
  if (!status) return "-";
  return STATUS_MAP[status]?.label ?? status;
}
