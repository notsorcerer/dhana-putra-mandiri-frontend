/**
 * Struktur menu sidebar per peran, mengikuti matriks RBAC backend:
 * dhana-putra-mandiri-backend/README.md
 * dan tata letak navigasi prototipe lama (ops/navigation.py).
 */

import type { SpriteIconName } from "@/components/app/svg-sprites";
import type { Role } from "./auth";

export type { Role };

const ALL_ROLES: Role[] = [
  "direktur",
  "admin",
  "sales",
  "gudang",
  "kasir",
  "accounting",
  "stakeholder",
];

export interface MenuItem {
  href: string;
  label: string;
  icon: SpriteIconName;
  roles: Role[];
  /** Badge angka (mis. jumlah piutang lewat tempo). */
  badge?: number;
  /** Aturan sorotan kustom. */
  isActive?: (pathname: string) => boolean;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const MENU: MenuSection[] = [
  {
    title: "Operasional",
    items: [
      {
        href: "/",
        label: "Ringkasan",
        icon: "grid",
        roles: ALL_ROLES,
      },
      {
        href: "/sales-invoices",
        label: "Pesanan",
        icon: "bag",
        roles: ["direktur", "admin", "sales", "kasir", "accounting", "stakeholder"],
      },
      {
        href: "/customers",
        label: "Pelanggan",
        icon: "people",
        roles: ALL_ROLES,
      },
      {
        href: "/products",
        label: "Stok & Gudang",
        icon: "box",
        roles: ["direktur", "admin", "sales", "gudang", "accounting", "stakeholder"],
        isActive: (p) =>
          p === "/products" ||
          p.startsWith("/products/abc-analysis") ||
          p.startsWith("/stock-movements"),
      },
      {
        href: "/goods-receipts",
        label: "Pembelian",
        icon: "cart",
        roles: ["direktur", "admin", "gudang", "kasir", "accounting", "stakeholder"],
      },
      {
        href: "/deliveries",
        label: "Pengiriman",
        icon: "truck",
        roles: ["direktur", "admin", "sales", "gudang", "kasir", "accounting", "stakeholder"],
      },
      {
        href: "/debit-notes",
        label: "Retur",
        icon: "undo",
        roles: ["direktur", "admin", "kasir", "accounting", "stakeholder"],
      },
    ],
  },
  {
    title: "Keuangan",
    items: [
      {
        href: "/reports/balance-sheet",
        label: "Piutang",
        icon: "receipt",
        roles: ["direktur", "admin", "sales", "kasir", "accounting", "stakeholder"],
        isActive: (p) => p === "/reports/balance-sheet",
      },
      {
        href: "/payments",
        label: "Kas & Bank",
        icon: "wallet",
        roles: ["direktur", "admin", "kasir", "accounting", "stakeholder"],
        isActive: (p) => p.startsWith("/payments") || p.startsWith("/chart-of-accounts"),
      },
    ],
  },
  {
    title: "Perencanaan",
    items: [
      {
        href: "/products/stock-estimation",
        label: "Pengisian Stok",
        icon: "layers",
        roles: ALL_ROLES,
        isActive: (p) => p.startsWith("/products/stock-estimation"),
      },
      {
        href: "/hr/payroll",
        label: "Fee & Payroll",
        icon: "percent",
        roles: ["direktur", "admin", "gudang", "kasir", "accounting"],
        isActive: (p) => p.startsWith("/hr"),
      },
    ],
  },
  {
    title: "Perusahaan",
    items: [
      {
        href: "/reports",
        label: "Laporan",
        icon: "report",
        roles: ["direktur", "admin", "sales", "kasir", "accounting", "stakeholder"],
        isActive: (p) => p.startsWith("/reports") && p !== "/reports/balance-sheet",
      },
      {
        href: "/general-ledger",
        label: "Log & Jurnal",
        icon: "clock",
        roles: ["direktur", "admin", "kasir", "accounting", "stakeholder"],
      },
      {
        href: "/suppliers",
        label: "Data Master",
        icon: "database",
        roles: ALL_ROLES,
        isActive: (p) => p === "/suppliers",
      },
      {
        href: "/accounting-periods",
        label: "Pengaturan",
        icon: "settings",
        roles: ["direktur", "admin", "accounting", "stakeholder"],
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
// Matriks aksi tulis per peran (mengikuti dhana-putra-mandiri-backend/README.md)
// ---------------------------------------------------------------------------

export const CAN = {
  manageProducts: ["direktur", "admin"] as Role[],
  manageMasterData: ["direktur", "admin"] as Role[], // pelanggan, pemasok
  createGoodsReceipt: ["direktur", "admin", "gudang"] as Role[],
  createDelivery: ["direktur", "admin", "sales", "gudang"] as Role[],
  confirmDocuments: ["direktur", "gudang"] as Role[],
  createInvoice: ["direktur", "admin", "sales"] as Role[],
  createPayment: ["direktur", "admin", "kasir"] as Role[],
  createDebitNote: ["direktur", "admin", "accounting"] as Role[],
  manageCoa: ["direktur", "accounting"] as Role[],
  managePeriods: ["direktur", "accounting"] as Role[],
  manageEmployees: ["direktur", "admin", "accounting"] as Role[],
  manageHr: ["direktur", "admin", "gudang", "accounting"] as Role[],
  generatePayroll: ["direktur", "accounting"] as Role[],
  disbursePayroll: ["direktur", "admin", "kasir"] as Role[],
  viewFinancialValues: ["direktur", "admin", "accounting", "kasir", "stakeholder"] as Role[],
  viewPayroll: ["direktur", "admin", "kasir", "accounting"] as Role[],
  viewEmployees: ["direktur", "admin", "accounting"] as Role[],
  viewHrOps: ["direktur", "admin", "accounting"] as Role[],
  viewLaborRecords: ["direktur", "admin", "gudang", "accounting"] as Role[],
  viewSalesReports: ["direktur", "admin", "sales", "kasir", "accounting", "stakeholder"] as Role[],
  viewFinanceReports: ["direktur", "admin", "kasir", "accounting", "stakeholder"] as Role[],
} as const;

export function can(action: readonly Role[], role: Role | undefined): boolean {
  if (!role) return false;
  return action.includes(role);
}
