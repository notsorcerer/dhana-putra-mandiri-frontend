"use client";

/**
 * Editor baris item untuk formulir dokumen ber-item:
 * penerimaan barang (GR), surat jalan (delivery), dan faktur penjualan.
 *
 * Catatan: backend saat ini mengalami error 500 saat menyimpan dokumen
 * beserta items dalam satu request (lihat README — keterbatasan backend).
 * Formulir tetap mengikuti kontrak API; submit menangani fallback.
 */

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { num, rupiah } from "@/lib/format";
import type { Product } from "@/types/api";

function ProductCell({
  products,
  value,
  onChange,
}: {
  products: Product[];
  value: number | "";
  onChange: (id: number | "") => void;
}) {
  return (
    <select
      value={value === "" ? "" : String(value)}
      onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      className="h-8 w-full min-w-44 rounded-md border border-input bg-transparent px-2 text-sm"
    >
      <option value="">— pilih produk —</option>
      {products.map((p) => (
        <option key={p.id} value={p.id}>
          {p.sku} — {p.name}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Penerimaan Barang (Goods Receipt)
// ---------------------------------------------------------------------------

export interface GrItemDraft {
  product: number | "";
  qty_ordered: string;
  qty_actual: string;
  purchase_price: string;
  notes: string;
}

export function emptyGrItem(): GrItemDraft {
  return { product: "", qty_ordered: "", qty_actual: "", purchase_price: "", notes: "" };
}

export function GoodsReceiptItemsEditor({
  rows,
  onChange,
  products,
  showCost,
}: {
  rows: GrItemDraft[];
  onChange: (rows: GrItemDraft[]) => void;
  products: Product[];
  /** false untuk peran Gudang (field biaya disembunyikan serializer backend). */
  showCost: boolean;
}) {
  const update = (index: number, patch: Partial<GrItemDraft>) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="min-w-48">Produk</TableHead>
              <TableHead>Dipesan</TableHead>
              <TableHead>Diterima</TableHead>
              {showCost ? <TableHead>Harga Beli / unit</TableHead> : null}
              <TableHead>Catatan</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showCost ? 6 : 5} className="py-6 text-center text-sm text-muted-foreground">
                  Belum ada item. Klik “Tambah Item”.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <ProductCell products={products} value={row.product} onChange={(v) => update(i, { product: v })} />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.qty_ordered}
                      onChange={(e) => update(i, { qty_ordered: e.target.value })}
                      className="w-24"
                      placeholder="0"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.qty_actual}
                      onChange={(e) => update(i, { qty_actual: e.target.value })}
                      className="w-24"
                      placeholder="0"
                    />
                  </TableCell>
                  {showCost ? (
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.purchase_price}
                        onChange={(e) => update(i, { purchase_price: e.target.value })}
                        className="w-32"
                        placeholder="0"
                      />
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <Input
                      value={row.notes}
                      onChange={(e) => update(i, { notes: e.target.value })}
                      className="min-w-36"
                      placeholder="Opsional"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
                      aria-label="Hapus item"
                    >
                      <Trash2 className="text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...rows, emptyGrItem()])}>
        <Plus /> Tambah Item
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Surat Jalan (Delivery)
// ---------------------------------------------------------------------------

export interface DeliveryItemDraft {
  product: number | "";
  qty: string;
  qty_delivered: string;
}

export function emptyDeliveryItem(): DeliveryItemDraft {
  return { product: "", qty: "", qty_delivered: "" };
}

export function DeliveryItemsEditor({
  rows,
  onChange,
  products,
}: {
  rows: DeliveryItemDraft[];
  onChange: (rows: DeliveryItemDraft[]) => void;
  products: Product[];
}) {
  const update = (index: number, patch: Partial<DeliveryItemDraft>) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="min-w-48">Produk</TableHead>
              <TableHead>Jumlah Pesanan</TableHead>
              <TableHead>Jumlah Kirim</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                  Belum ada item. Klik “Tambah Item”.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <ProductCell products={products} value={row.product} onChange={(v) => update(i, { product: v })} />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.qty}
                      onChange={(e) => update(i, { qty: e.target.value })}
                      className="w-24"
                      placeholder="0"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.qty_delivered}
                      onChange={(e) => update(i, { qty_delivered: e.target.value })}
                      className="w-24"
                      placeholder="0"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
                      aria-label="Hapus item"
                    >
                      <Trash2 className="text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...rows, emptyDeliveryItem()])}>
        <Plus /> Tambah Item
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Faktur Penjualan (Sales Invoice)
// ---------------------------------------------------------------------------

export interface InvoiceItemDraft {
  product: number | "";
  qty: string;
  unit_price: string;
  discount_amount: string;
}

export function emptyInvoiceItem(): InvoiceItemDraft {
  return { product: "", qty: "", unit_price: "", discount_amount: "" };
}

export function invoiceDraftSubtotal(rows: InvoiceItemDraft[]): number {
  return rows.reduce(
    (total, row) => total + num(row.qty) * num(row.unit_price) - num(row.discount_amount),
    0,
  );
}

export function InvoiceItemsEditor({
  rows,
  onChange,
  products,
  onProductPick,
}: {
  rows: InvoiceItemDraft[];
  onChange: (rows: InvoiceItemDraft[]) => void;
  products: Product[];
  /** Dipanggil saat produk dipilih (mis. untuk mengisi harga jual otomatis). */
  onProductPick?: (productId: number) => void;
}) {
  const update = (index: number, patch: Partial<InvoiceItemDraft>) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const subtotal = invoiceDraftSubtotal(rows);

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="min-w-48">Produk</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Harga / unit</TableHead>
              <TableHead>Diskon baris</TableHead>
              <TableHead>Total baris</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                  Belum ada item. Klik “Tambah Item”.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <ProductCell
                      products={products}
                      value={row.product}
                      onChange={(v) => {
                        update(i, { product: v });
                        if (v !== "") onProductPick?.(v);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.qty}
                      onChange={(e) => update(i, { qty: e.target.value })}
                      className="w-20"
                      placeholder="0"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.unit_price}
                      onChange={(e) => update(i, { unit_price: e.target.value })}
                      className="w-32"
                      placeholder="0"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.discount_amount}
                      onChange={(e) => update(i, { discount_amount: e.target.value })}
                      className="w-28"
                      placeholder="0"
                    />
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {rupiah(num(row.qty) * num(row.unit_price) - num(row.discount_amount))}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
                      aria-label="Hapus item"
                    >
                      <Trash2 className="text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...rows, emptyInvoiceItem()])}>
          <Plus /> Tambah Item
        </Button>
        <p className="text-sm text-muted-foreground">
          Subtotal item: <span className="font-medium text-foreground">{rupiah(subtotal)}</span>
        </p>
      </div>
    </div>
  );
}
