"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError, apiPost, fetchAllPages } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { num, rupiah, suggestDocNumber, todayIso } from "@/lib/format";
import { CAN, can } from "@/lib/menu";
import type {
  ChartOfAccounts,
  Customer,
  GoodsReceipt,
  Payment,
  PaymentCategory,
  SalesInvoice,
  Supplier,
} from "@/types/api";

const CATEGORY_OPTIONS: { value: PaymentCategory; label: string; prefix: string }[] = [
  { value: "customer_receipt", label: "Penerimaan Piutang Customer (BKM)", prefix: "BKM" },
  { value: "supplier_payment", label: "Pembayaran Hutang Supplier (BKK)", prefix: "BKK" },
  { value: "payroll", label: "Pembayaran Gaji Pegawai (BKK)", prefix: "BKK" },
  { value: "operational_expense", label: "Pembayaran Beban Operasional (BKK)", prefix: "BKK" },
  { value: "other", label: "Lain-lain", prefix: "BKK" },
];

const PAYMENT_TYPE_OPTIONS = [
  { value: "cash", label: "Kas Tunai" },
  { value: "bank_transfer", label: "Transfer Bank" },
  { value: "giro", label: "Giro / Cek" },
];

/**
 * Halaman Catat Mutasi Dana:
 * paritas penuh dengan templates/form.html (<form class="panel formgrid">).
 */
export default function NewPaymentPage() {
  const router = useRouter();
  const { session } = useAuth();
  const canCreate = can(CAN.createPayment, session?.role);

  const [coa, setCoa] = useState<ChartOfAccounts[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    payment_number: suggestDocNumber("BKM"),
    category: "customer_receipt" as PaymentCategory,
    payment_type: "bank_transfer",
    cash_bank_account: "",
    amount: "",
    payment_date: todayIso(),
    reference_number: "",
    customer: "",
    supplier: "",
    sales_invoice: "",
    goods_receipt: "",
    notes: "",
  });

  useEffect(() => {
    fetchAllPages<ChartOfAccounts>("/finance/chart-of-accounts/")
      .then((rows) =>
        setCoa(
          rows.filter(
            (acc) =>
              acc.account_type === "ASSET" &&
              acc.code.startsWith("11") &&
              acc.code !== "1130" &&
              acc.code !== "1140",
          ),
        ),
      )
      .catch(() => toast.error("Gagal memuat daftar akun kas/bank."));
    fetchAllPages<Customer>("/finance/customers/")
      .then(setCustomers)
      .catch(() => undefined);
    fetchAllPages<Supplier>("/finance/suppliers/")
      .then(setSuppliers)
      .catch(() => undefined);
    fetchAllPages<SalesInvoice>("/finance/sales-invoices/")
      .then((rows) =>
        setInvoices(
          rows.filter(
            (inv) =>
              inv.status !== "paid" &&
              inv.status !== "cancelled" &&
              num(inv.total_amount) > 0,
          ),
        ),
      )
      .catch(() => undefined);
    fetchAllPages<GoodsReceipt>("/inventory/goods-receipts/")
      .then(setReceipts)
      .catch(() => undefined);
  }, []);

  const set = <K extends keyof typeof form>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const changeCategory = (category: PaymentCategory) => {
    const option = CATEGORY_OPTIONS.find((c) => c.value === category);
    setForm((prev) => ({
      ...prev,
      category,
      payment_number: suggestDocNumber(option?.prefix ?? "BKK"),
      customer: category === "customer_receipt" ? prev.customer : "",
      supplier: category === "supplier_payment" ? prev.supplier : "",
      sales_invoice: category === "customer_receipt" ? prev.sales_invoice : "",
      goods_receipt: category === "supplier_payment" ? prev.goods_receipt : "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        payment_number: form.payment_number,
        payment_type: form.payment_type,
        category: form.category,
        cash_bank_account: Number(form.cash_bank_account),
        amount: form.amount,
        payment_date: form.payment_date,
        reference_number: form.reference_number,
        notes: form.notes,
      };
      if (form.category === "customer_receipt" && form.customer !== "") {
        payload.customer = Number(form.customer);
        if (form.sales_invoice !== "") payload.sales_invoice = Number(form.sales_invoice);
      }
      if (form.category === "supplier_payment" && form.supplier !== "") {
        payload.supplier = Number(form.supplier);
        if (form.goods_receipt !== "") payload.goods_receipt = Number(form.goods_receipt);
      }

      const data = await apiPost<Payment>("/finance/payments/", payload);
      toast.success(`Mutasi ${data.payment_number} telah dibukukan.`);
      router.push("/payments");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Gagal menyimpan pembayaran.";
      toast.error(message, { duration: 8000 });
    } finally {
      setSaving(false);
    }
  };

  if (!canCreate) {
    return (
      <div>
        <h1>Catat mutasi dana</h1>
        <p className="empty-state panel">
          Peran Anda hanya dapat melihat mutasi kas & bank.
        </p>
      </div>
    );
  }

  const isCustomerReceipt = form.category === "customer_receipt";
  const isSupplierPayment = form.category === "supplier_payment";

  return (
    <div>
      <h1>Catat mutasi dana</h1>
      <form className="panel formgrid" onSubmit={handleSubmit}>
        <label>
          Tanggal mutasi
          <input
            type="date"
            required
            value={form.payment_date}
            onChange={(e) => set("payment_date", e.target.value)}
          />
        </label>
        <label>
          Jenis mutasi
          <select
            required
            value={form.category}
            onChange={(e) => changeCategory(e.target.value as PaymentCategory)}
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Akun kas / bank
          <select
            required
            value={form.cash_bank_account}
            onChange={(e) => set("cash_bank_account", e.target.value)}
          >
            <option value="">Pilih akun</option>
            {coa.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.code} · {acc.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Metode pembayaran
          <select
            required
            value={form.payment_type}
            onChange={(e) => set("payment_type", e.target.value)}
          >
            {PAYMENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Jumlah (Rp)
          <input
            type="number"
            min="0.01"
            step="0.01"
            required
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            placeholder="0"
          />
        </label>
        <label>
          Nomor bukti unik
          <input
            required
            value={form.payment_number}
            onChange={(e) => set("payment_number", e.target.value)}
          />
        </label>

        {isCustomerReceipt ? (
          <>
            <label>
              Pelanggan
              <select
                required
                value={form.customer}
                onChange={(e) => set("customer", e.target.value)}
              >
                <option value="">Pilih pelanggan</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} · {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Dokumen asal (faktur)
              <select
                value={form.sales_invoice}
                onChange={(e) => set("sales_invoice", e.target.value)}
              >
                <option value="">Tanpa referensi faktur</option>
                {invoices
                  .filter(
                    (inv) =>
                      form.customer === "" ||
                      String(inv.customer ?? "") === form.customer,
                  )
                  .map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} · {inv.customer_name || "Internal"} ·{" "}
                      {rupiah(inv.total_amount)}
                    </option>
                  ))}
              </select>
            </label>
          </>
        ) : null}

        {isSupplierPayment ? (
          <>
            <label>
              Pemasok
              <select
                required
                value={form.supplier}
                onChange={(e) => set("supplier", e.target.value)}
              >
                <option value="">Pilih pemasok</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} · {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Dokumen asal (penerimaan)
              <select
                value={form.goods_receipt}
                onChange={(e) => set("goods_receipt", e.target.value)}
              >
                <option value="">Tanpa referensi penerimaan</option>
                {receipts.map((gr) => (
                  <option key={gr.id} value={gr.id}>
                    {gr.receipt_number} · {gr.supplier_name || "Internal"}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}

        <label className="wide">
          Nomor referensi bank / kwitansi
          <input
            value={form.reference_number}
            onChange={(e) => set("reference_number", e.target.value)}
            placeholder="Opsional"
          />
        </label>

        <label className="wide">
          Catatan / alasan
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </label>

        <div>
          <button
            type="submit"
            disabled={saving || form.cash_bank_account === "" || form.amount === ""}
          >
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}
