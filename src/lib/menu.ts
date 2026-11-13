/**
 * Struktur menu sidebar per peran, mengikuti matriks RBAC backend:
 * https://github.com/adamleonn/dhana-putra-mandiri-backend (README.md).
 *
 * Menu hanya menyembunyikan tautan; otorisasi sesungguhnya tetap
 * ditegakkan backend (permission class per ViewSet).
 */

import {
  BarChart3,
  Boxes,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  History,
  Landmark,
  LayoutDashboard,
  LineChart,
  Package,
  Receipt,
  ScrollText,
  Truck,
  Users,
  UsersRound,
  Warehouse,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Role } from "./auth";

const ALL_ROLES: Role[] = ["direktur", "admin", "sales", "gudang", "kasir", "accounting", "stakeholder"];

export interface MenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const MENU: MenuSection[] = [
  {
    title: "Utama",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ALL_ROLES },
    ],
  },
  {
    title: "Inventori",
    items: [
      {
        href: "/products",
        label: "Produk",
        icon: Package,
        roles: ["direktur", "admin", "sales", "gudang", "accounting", "stakeholder"],
      },
      {
        href: "/products/abc-analysis",
        label: "Analisis ABC",
        icon: BarChart3,
        roles: ["direktur", "admin", "accounting", "stakeholder"],
      },
      {
        href: "/products/stock-estimation",
        label: "Estimasi Stok",
        icon: Boxes,
        roles: ALL_ROLES,
      },
      {
        href: "/stock-movements",
        label: "Pergerakan Stok",
        icon: History,
        roles: ["direktur", "gudang", "accounting", "stakeholder"],
      },
      {
        href: "/goods-receipts",
        label: "Penerimaan Barang",
        icon: Warehouse,
        roles: ["direktur", "admin", "gudang", "kasir", "accounting", "stakeholder"],
      },
      {
        href: "/deliveries",
        label: "Surat Jalan",
        icon: Truck,
        roles: ["direktur", "gudang", "accounting", "stakeholder"],
      },
    ],
  },
  {
    title: "Keuangan",
    items: [
      {
        href: "/customers",
        label: "Pelanggan",
        icon: Users,
        roles: ["direktur", "admin", "sales", "kasir", "accounting", "stakeholder"],
      },
      {
        href: "/suppliers",
        label: "Pemasok",
        icon: UsersRound,
        roles: ["direktur", "gudang", "kasir", "accounting", "stakeholder"],
      },
      {
        href: "/sales-invoices",
        label: "Faktur Penjualan",
        icon: Receipt,
        roles: ["direktur", "admin", "sales", "kasir", "accounting", "stakeholder"],
      },
      {
        href: "/payments",
        label: "Pembayaran",
        icon: FileText,
        roles: ["direktur", "admin", "kasir", "accounting"],
      },
      {
        href: "/debit-notes",
        label: "Debit Note",
        icon: ScrollText,
        roles: ["direktur", "admin", "kasir", "accounting", "stakeholder"],
      },
      {
        href: "/general-ledger",
        label: "Buku Besar",
        icon: FileSpreadsheet,
        roles: ["direktur", "kasir", "accounting"],
      },
      {
        href: "/chart-of-accounts",
        label: "Bagan Akun (COA)",
        icon: Landmark,
        roles: ["direktur", "admin", "kasir", "accounting", "stakeholder"],
      },
      {
        href: "/accounting-periods",
        label: "Periode Akuntansi",
        icon: ClipboardList,
        roles: ["direktur", "accounting", "stakeholder"],
      },
      {
        href: "/reports",
        label: "Laporan",
        icon: LineChart,
        roles: ["direktur", "admin", "kasir", "accounting", "stakeholder"],
      },
    ],
  },
  {
    title: "SDM",
    items: [
      {
        href: "/hr/employees",
        label: "Karyawan",
        icon: Users,
        roles: ["direktur", "accounting"],
      },
      {
        href: "/hr/mutations",
        label: "Mutasi Karyawan",
        icon: UsersRound,
        roles: ["direktur", "accounting"],
      },
      {
        href: "/hr/labor-records",
        label: "Catatan Kerja",
        icon: ClipboardList,
        roles: ["direktur", "accounting"],
      },
      {
        href: "/hr/payroll",
        label: "Payroll",
        icon: FileText,
        roles: ["direktur", "admin", "kasir", "accounting"],
      },
    ],
  },
];

export function menuForRole(role: Role): MenuSection[] {
  return MENU.map((section) => ({
    title: section.title,
    items: section.items.filter((item) => item.roles.includes(role)),
  })).filter((section) => section.items.length > 0);
}

// ---------------------------------------------------------------------------
// Matriks aksi tulis per peran (tombol tambah/ubah/konfirmasi disembunyikan
// untuk peran yang tidak berhak menurut backend).
// ---------------------------------------------------------------------------

export const CAN = {
  manageProducts: ["direktur"] as Role[],
  manageMasterData: ["direktur"] as Role[], // pelanggan, pemasok
  createGoodsReceipt: ["direktur", "gudang"] as Role[],
  createDelivery: ["direktur", "gudang"] as Role[],
  confirmDocuments: ["direktur", "gudang"] as Role[],
  createInvoice: ["direktur", "admin", "sales"] as Role[],
  createPayment: ["direktur", "admin", "kasir"] as Role[],
  createDebitNote: ["direktur", "accounting"] as Role[],
  manageCoa: ["direktur", "accounting"] as Role[],
  managePeriods: ["direktur", "accounting"] as Role[],
  manageEmployees: ["direktur", "accounting"] as Role[], // karyawan (master data SDM)
  manageHr: ["direktur", "accounting"] as Role[], // mutasi & catatan kerja
  generatePayroll: ["direktur", "accounting"] as Role[],
  disbursePayroll: ["direktur", "admin", "kasir"] as Role[],
  viewFinancialValues: ["direktur", "admin", "accounting", "kasir", "stakeholder"] as Role[],
} as const;

export function can(action: (typeof CAN)[keyof typeof CAN], role: Role | undefined): boolean {
  if (!role) return false;
  return (action as readonly Role[]).includes(role);
}
