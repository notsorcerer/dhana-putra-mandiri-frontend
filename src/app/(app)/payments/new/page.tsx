"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/app/page-header";
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
      .then((rows) => setCoa(rows.filter((acc) => acc.account_type === "ASSET" && acc.code.startsWith("11") && acc.code !== "1130" && acc.code !== "1140")))
      .catch(() => toast.error("Gagal memuat daftar akun kas/bank."));
    fetchAllPages<Customer>("/finance/customers/").then(setCustomers).catch(() => undefined);
    fetchAllPages<Supplier>("/finance/suppliers/").then(setSuppliers).catch(() => undefined);
    fetchAllPages<SalesInvoice>("/finance/sales-invoices/")
      .then((rows) => setInvoices(rows.filter((inv) => inv.status !== "paid" && inv.status !== "cancelled" && num(inv.total_amount) > 0)))
      .catch(() => undefined);
    fetchAllPages<GoodsReceipt>("/inventory/goods-receipts/").then(setReceipts).catch(() => undefined);
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
      toast.success(`Pembayaran ${data.payment_number} berhasil dicatat (${rupiah(data.amount)}).`);
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
        <PageHeader title="Buat Pembayaran" />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Peran Anda hanya dapat melihat pembayaran (bukan membuat).
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCustomerReceipt = form.category === "customer_receipt";
  const isSupplierPayment = form.category === "supplier_payment";

  return (
    <div>
      <PageHeader
        title="Buat Pembayaran"
        description="Bukti kas masuk (BKM) untuk penerimaan piutang, atau bukti kas keluar (BKK) untuk pengeluaran."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/payments">
            <ArrowLeft /> Kembali
          </Link>
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pembayaran</CardTitle>
            <CardDescription>
              Nomor dokumen otomatis mengikuti kategori (BKM/BKK) dan dapat diubah. Akun kas/bank hanya
              menampilkan akun kas dan rekening bank.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="category">Kategori *</Label>
              <select
                id="category"
                required
                value={form.category}
                onChange={(e) => changeCategory(e.target.value as PaymentCategory)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payment_number">Nomor Dokumen *</Label>
              <Input id="payment_number" required value={form.payment_number} onChange={(e) => set("payment_number", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payment_type">Metode Pembayaran *</Label>
              <select
                id="payment_type"
                required
                value={form.payment_type}
                onChange={(e) => set("payment_type", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {PAYMENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cash_bank_account">Akun Kas / Bank *</Label>
              <select
                id="cash_bank_account"
                required
                value={form.cash_bank_account}
                onChange={(e) => set("cash_bank_account", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="">— pilih akun —</option>
                {coa.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.code} · {acc.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount">Jumlah *</Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payment_date">Tanggal Pembayaran *</Label>
              <Input id="payment_date" type="date" required value={form.payment_date} onChange={(e) => set("payment_date", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reference_number">Nomor Referensi</Label>
              <Input id="reference_number" value={form.reference_number} onChange={(e) => set("reference_number", e.target.value)} placeholder="No. cek / transfer / kwitansi" />
            </div>
          </CardContent>
        </Card>

        {isCustomerReceipt ? (
          <Card>
            <CardHeader>
              <CardTitle>Penerimaan dari Pelanggan</CardTitle>
              <CardDescription>
                Pilih pelanggan dari master data, lalu tautkan faktur agar pembayaran tercatat pada piutang.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="customer">Pelanggan *</Label>
                <select
                  id="customer"
                  required
                  value={form.customer}
                  onChange={(e) => set("customer", e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">— pilih pelanggan —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} · {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sales_invoice">Faktur Terkait</Label>
                <select
                  id="sales_invoice"
                  value={form.sales_invoice}
                  onChange={(e) => set("sales_invoice", e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">— tanpa faktur —</option>
                  {invoices
                    .filter((inv) => form.customer === "" || String(inv.customer ?? "") === form.customer)
                    .map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoice_number} · {inv.customer_name || "-"} · {rupiah(inv.total_amount)}
                      </option>
                    ))}
                </select>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {isSupplierPayment ? (
          <Card>
            <CardHeader>
              <CardTitle>Pembayaran ke Pemasok</CardTitle>
              <CardDescription>
                Pilih pemasok dari master data; tautkan penerimaan barang bila melunasi hutang pembelian
                tertentu.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="supplier">Pemasok *</Label>
                <select
                  id="supplier"
                  required
                  value={form.supplier}
                  onChange={(e) => set("supplier", e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">— pilih pemasok —</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} · {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="goods_receipt">Penerimaan Barang Terkait</Label>
                <select
                  id="goods_receipt"
                  value={form.goods_receipt}
                  onChange={(e) => set("goods_receipt", e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">— tanpa penerimaan —</option>
                  {receipts.map((gr) => (
                    <option key={gr.id} value={gr.id}>
                      {gr.receipt_number} · {gr.supplier_name || "-"}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Catatan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Keterangan</Label>
              <Textarea id="notes" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Keterangan tambahan pembayaran…" />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end">
          <Button type="submit" disabled={saving || form.cash_bank_account === "" || form.amount === ""}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            Simpan Pembayaran
          </Button>
        </div>
      </form>
    </div>
  );
}
