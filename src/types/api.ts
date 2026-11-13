/**
 * Tipe data respons REST API CV Dhana Putra Mandiri.
 *
 * Catatan penting:
 * - DRF memakai PageNumberPagination (PAGE_SIZE = 20) -> bentuk { count, next, previous, results }.
 * - Field desimal (DecimalField) diserialisasi sebagai string, mis. "420.00".
 * - Beberapa field disembunyikan serializer berdasarkan peran:
 *   Produk        : Gudang tanpa `moving_average_hpp` + `selling_price`, Sales tanpa `moving_average_hpp`.
 *   Item GR/SJ/INV: Gudang & Sales tanpa field biaya (hpp, cogs, purchase_price, dll).
 *   Karena itu field tersebut diberi tanda opsional (`?`).
 */

// ---------------------------------------------------------------------------
// Umum
// ---------------------------------------------------------------------------

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ---------------------------------------------------------------------------
// Inventori
// ---------------------------------------------------------------------------

export interface ProductPriceTier {
  id: number;
  product: number;
  min_qty: string;
  price: string;
  effective_from: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  brand: string;
  package_size: string;
  description: string;
  uom: string;
  base_unit: string;
  conversion_factor: string;
  current_stock: string;
  stock_value?: string;
  moving_average_hpp?: string;
  selling_price?: string;
  lead_time_days?: number;
  abc_class: string;
  daily_consumption_rate: string;
  min_stock_level: string;
  estimated_days_of_stock?: number | string;
  estimated_stock_days?: number;
  is_stock_below_28_days?: boolean;
  price_tiers?: ProductPriceTier[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GoodsReceiptItem {
  id: number;
  product: number;
  product_sku: string;
  product_name: string;
  product_uom: string;
  qty_ordered: string;
  qty_actual: string;
  purchase_price?: string;
  allocated_transport_cost?: string;
  allocated_unloading_cost?: string;
  effective_unit_cost?: string;
  line_total?: string;
  discrepancy_qty?: number | string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type DocStatus = "draft" | "confirmed" | "paid" | "unpaid" | "partial" | "partially_paid" | "cancelled" | "approved" | "applied" | "completed";
export type PeriodStatus = "OPEN" | "SUBMITTED" | "CLOSED";

export interface GoodsReceipt {
  id: number;
  receipt_number: string;
  purchase_order?: number | null;
  supplier: number | null;
  supplier_code: string | null;
  supplier_name: string;
  po_reference?: string;
  receipt_date: string;
  due_date?: string | null;
  payment_method?: "cash" | "credit";
  payment_status?: DocStatus;
  transport_cost?: string;
  unloading_cost?: string;
  payable_amount?: string;
  debit_note_total?: string;
  paid_amount?: string;
  net_payable?: string | number;
  status: DocStatus;
  notes: string;
  created_by?: number | null;
  created_by_name?: string;
  received_by?: number | null;
  received_by_name?: string | null;
  confirmed_at: string | null;
  has_quantity_discrepancy: boolean;
  items: GoodsReceiptItem[];
  created_at: string;
  updated_at: string;
}

export interface DeliveryItem {
  id: number;
  product: number;
  product_sku: string;
  product_name: string;
  product_uom: string;
  sales_invoice_item?: number | null;
  qty: string;
  qty_delivered: string | null;
  effective_qty?: number | string;
  hpp_at_delivery?: string;
  total_cogs?: string;
  created_at: string;
  updated_at: string;
}

export interface Delivery {
  id: number;
  delivery_number: string;
  sales_invoice?: number | null;
  invoice_number?: string;
  customer: number | null;
  customer_code: string | null;
  customer_name: string;
  delivery_date: string;
  driver_name: string;
  vehicle_number: string;
  sales_order_ref?: string;
  status: DocStatus;
  confirmed_at: string | null;
  created_by?: number | null;
  created_by_name?: string;
  confirmed_by?: number | null;
  confirmed_by_name?: string | null;
  notes: string;
  items: DeliveryItem[];
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: number;
  product: number;
  product_sku: string;
  product_name: string;
  product_uom?: string;
  movement_date: string;
  movement_type: "IN" | "OUT" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT";
  movement_type_display?: string;
  reference_type: string;
  reference_type_display?: string;
  reference_number?: string;
  reference_id?: string;
  qty: string;
  unit_cost?: string;
  total_cost?: string;
  stock_before: string;
  stock_after: string;
  hpp_after?: string;
  goods_receipt_item?: number | null;
  delivery_item?: number | null;
  created_by?: number | null;
  created_by_name?: string;
  notes: string;
  created_at: string;
}

export interface AbcRow {
  sku: string;
  name: string;
  current_stock: number;
  moving_average_hpp: number;
  total_value: number;
  percentage: number;
  cumulative_percentage: number;
  abc_class: "A" | "B" | "C";
  estimated_runway_days: number;
  is_stock_below_28_days: boolean;
}

export interface StockEstimationRow {
  id: number;
  sku: string;
  name: string;
  brand: string;
  package_size: string;
  uom: string;
  current_stock: number | string;
  daily_consumption_rate: number | string;
  estimated_stock_days: number;
  is_stock_below_lead_time?: boolean;
  is_stock_below_28_days?: boolean;
  lead_time_days?: number;
  abc_class: string;
}

// ---------------------------------------------------------------------------
// Keuangan — master
// ---------------------------------------------------------------------------

export interface Customer {
  id: number;
  code: string;
  name: string;
  tax_id?: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  credit_limit: string;
  payment_term_days?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: number;
  code: string;
  name: string;
  tax_id?: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  payment_term_days?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "COGS" | "EXPENSE";

export interface ChartOfAccounts {
  id: number;
  account_code?: string;
  code?: string;
  name: string;
  account_type: AccountType;
  parent?: number | null;
  report_group?: string;
  normal_balance?: "D" | "C";
  is_cash_bank?: boolean;
  is_postable?: boolean;
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface AccountingPeriod {
  id: number;
  period_name: string;
  start_date: string;
  end_date: string;
  status: PeriodStatus;
  is_closed: boolean;
  submitted_by?: number | null;
  submitted_by_name?: string;
  submitted_at?: string | null;
  closed_by: number | null;
  closed_by_name: string;
  closed_at: string | null;
  reopened_by: number | null;
  reopened_by_name: string;
  reopened_at: string | null;
  closing_notes?: string;
  reopen_reason: string;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Keuangan — jurnal & transaksi
// ---------------------------------------------------------------------------

export interface GeneralLedgerLine {
  id: number;
  account: number;
  account_code: string;
  account_name: string;
  debit?: string;
  credit?: string;
  memo: string;
  created_at?: string;
  updated_at?: string;
}

export interface GeneralLedger {
  id: number;
  transaction_number?: string;
  entry_number?: string;
  date?: string;
  transaction_date?: string;
  period: number;
  period_name?: string;
  reference_type: string;
  reference_id: string;
  description: string;
  is_posted: boolean;
  reversal_of?: number | null;
  created_by?: number | null;
  posted_by: number | null;
  posted_by_name: string;
  total_debit?: number;
  total_credit?: number;
  is_balanced?: boolean;
  lines: GeneralLedgerLine[];
  created_at: string;
  updated_at: string;
}

export interface SalesInvoiceItem {
  id: number;
  product: number;
  product_sku: string;
  product_name: string;
  qty_ordered: string;
  qty_delivered: string | null;
  effective_billed_qty?: string | number;
  qty?: string;
  unit_price?: string;
  discount_amount?: string;
  line_total?: string;
  created_at: string;
  updated_at: string;
}

export interface SalesInvoiceRevision {
  id: number;
  invoice?: number;
  revision_number: number;
  previous_subtotal?: string;
  new_subtotal?: string;
  previous_total?: string;
  old_total?: string;
  new_total: string;
  reason: string;
  revised_by: number | null;
  revised_by_username?: string;
  revised_by_name?: string;
  created_at: string;
}

export interface SalesInvoice {
  id: number;
  invoice_number: string;
  delivery?: number | null;
  customer: number | null;
  customer_code: string | null;
  customer_name: string;
  invoice_date: string;
  due_date: string;
  payment_method?: "cash" | "credit";
  subtotal?: string;
  discount_amount?: string;
  total_amount?: string;
  paid_amount?: string;
  remaining_due?: string | number;
  remaining_balance?: number;
  status: DocStatus;
  revision_no?: number;
  journal_entry?: number | null;
  created_by?: number | null;
  created_by_name?: string;
  notes: string;
  items: SalesInvoiceItem[];
  revisions?: SalesInvoiceRevision[];
  created_at: string;
  updated_at: string;
}

export interface DebitNote {
  id: number;
  debit_note_number: string;
  goods_receipt: number;
  receipt_number?: string;
  goods_receipt_number?: string;
  supplier: number | null;
  supplier_code?: string | null;
  supplier_name: string;
  date: string;
  amount?: string;
  reason: string;
  status: DocStatus;
  journal_entry: number | null;
  period?: number | null;
  created_by?: number | null;
  created_by_name?: string;
  issued_by: number | null;
  issued_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export type PaymentType = "cash" | "bank_transfer" | "giro";
export type PaymentCategory = "customer_receipt" | "supplier_payment" | "payroll" | "operational_expense" | "other";

export interface Payment {
  id: number;
  payment_number: string;
  payment_method?: PaymentType;
  payment_type?: PaymentType;
  category: PaymentCategory;
  direction?: "IN" | "OUT";
  cash_bank_account: number;
  cash_bank_name?: string;
  cash_bank_account_code?: string;
  cash_bank_account_name?: string;
  customer?: number | null;
  customer_name_display?: string;
  supplier?: number | null;
  supplier_name_display?: string;
  sales_invoice: number | null;
  invoice_number?: string;
  goods_receipt: number | null;
  receipt_number?: string;
  debit_note: number | null;
  payroll_slip?: number | null;
  amount?: string;
  payment_date: string;
  reference_number: string;
  status: DocStatus;
  notes: string;
  journal_entry: number | null;
  created_by?: number | null;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Laporan keuangan
// ---------------------------------------------------------------------------

export interface BalanceSheet {
  as_of_date: string;
  assets: {
    kas_dan_bank: { kas_tunai: number; bank_bca: number; bank_mandiri: number; subtotal: number };
    piutang_usaha: number;
    persediaan_barang_dagang: number;
    total_assets: number;
  };
  liabilities: {
    hutang_usaha_supplier: number;
    hutang_gaji_upah: number;
    hutang_ongkos_bongkar: number;
    total_liabilities: number;
  };
  equity: {
    modal_disetor: number;
    laba_ditahan: number;
    laba_periode_berjalan: number;
    total_equity: number;
  };
  summary: { total_assets: number; total_liabilities_and_equity: number; difference: number; is_balanced: boolean };
}

export interface SalesTrendPoint {
  month: number;
  month_name: string;
  period: string;
  total_sales: number;
  total_volume: number;
  total_cogs: number;
  gross_profit: number;
}

export interface SalesTrendsReport {
  year: number;
  trends: SalesTrendPoint[];
}

export interface PieSlice {
  label: string;
  stock_value: number;
  stock_qty: number;
  percentage: number;
}

export interface PieChartsReport {
  total_portfolio_value: number;
  brand_distribution: PieSlice[];
  package_size_distribution: PieSlice[];
}

export interface ProductSalesRow {
  sku: string;
  name: string;
  brand: string;
  package_size: string;
  uom: string;
  current_stock: number;
  moving_average_hpp: number;
  selling_price: number;
  qty_sold: number;
  revenue: number;
  cogs: number;
  gross_profit: number;
  margin_percentage: number;
}

export interface ProductSalesReport {
  year: number;
  total_revenue: number;
  total_cogs: number;
  total_gross_profit: number;
  products: ProductSalesRow[];
}

export interface AnnualReport {
  year: number;
  summary: {
    total_revenue: number;
    total_cogs: number;
    gross_profit: number;
    operating_expenses: {
      kuli_bongkar_expense: number;
      payroll_expense: number;
      armada_transport_expense: number;
      office_general_expense: number;
      total: number;
    };
    net_operating_profit: number;
    net_profit_margin_pct: number;
  };
  monthly_breakdown: SalesTrendPoint[];
  product_performance?: ProductSalesRow[];
  top_products?: ProductSalesRow[];
}

// ---------------------------------------------------------------------------
// SDM (HR)
// ---------------------------------------------------------------------------

export interface EmployeeMutation {
  id: number;
  employee: number;
  employee_name: string;
  mutation_date: string;
  effective_date?: string;
  mutation_type: string;
  mutation_type_display?: string;
  previous_department: string;
  new_department: string;
  previous_position: string;
  new_position: string;
  previous_salary?: string;
  new_salary?: string;
  reason: string;
  approved_by: number | null;
  approved_by_name: string;
  is_applied?: boolean;
  created_at: string;
  updated_at: string;
}

export interface LaborRecord {
  id: number;
  employee: number;
  employee_name: string;
  record_date: string;
  record_type: string;
  record_type_display?: string;
  title: string;
  description: string;
  hours: string;
  hourly_rate?: string;
  recorded_by: number | null;
  recorded_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: number;
  employee_id: string;
  user: number | null;
  full_name: string;
  email: string;
  phone: string;
  national_id?: string;
  tax_id?: string;
  department: string;
  department_display?: string;
  position: string;
  employment_status?: string;
  joined_date: string;
  termination_date?: string | null;
  base_salary?: string;
  standard_allowance?: string;
  bank_name: string;
  bank_account_number?: string;
  bank_account_holder: string;
  bpjs_tk_number?: string;
  bpjs_kes_number?: string;
  is_active: boolean;
  mutations: EmployeeMutation[];
  labor_records: LaborRecord[];
  created_at: string;
  updated_at: string;
}

export interface PayrollSlip {
  id: number;
  slip_number: string;
  employee: number;
  employee_nik?: string;
  employee_code?: string;
  employee_name: string;
  department?: string;
  period_month: number;
  period_year: number;
  base_salary?: string;
  allowances?: string;
  deductions?: string;
  net_salary?: string;
  payment_date: string | null;
  status: "draft" | "approved" | "paid" | "cancelled";
  accrual_journal_entry?: number | null;
  payment?: number | null;
  journal_entry?: number | null;
  journal_entry_number?: string;
  approved_by?: number | null;
  approved_by_name?: string;
  approved_at?: string | null;
  paid_by?: number | null;
  paid_by_name?: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

export interface HealthStatus {
  status: string;
  service: string;
  timestamp: string;
  database: string;
  modules: Record<string, string>;
}
