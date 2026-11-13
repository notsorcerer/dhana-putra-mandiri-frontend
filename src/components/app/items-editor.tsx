"use client";

/**
 * Editor baris item untuk formulir dokumen ber-item:
 * penerimaan barang (GR), surat jalan (delivery), dan faktur penjualan.
 *
 * Struktur markup mengikuti templates/create.html & static/app.js:
 * - <div class="wide" id="lines"><h2>Rincian barang</h2><div class="lineform">...</div></div>
 * - <div class="wide"><button type="button" class="secondary" id="addline">+ Tambah baris</button></div>
 * - <output class="line-subtotal wide">...</output>
 * - <div class="draft-total wide"><span>Total draf</span><strong id="draft-total">...</strong></div>
 */

import { num, rupiah } from "@/lib/format";
import type { Product } from "@/types/api";

function ProductSelect({
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
      name="product"
      value={value === "" ? "" : String(value)}
      onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      required
    >
      <option value="">Pilih produk</option>
      {products.map((p) => (
        <option key={p.id} value={p.id} data-unit={p.uom}>
          {p.sku} · {p.name}
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
    <>
      <div className="wide" id="lines">
        <h2>Rincian barang</h2>
        {rows.map((row, i) => {
          const picked = products.find((p) => p.id === row.product);
          return (
            <div key={i} className="lineform">
              <label>
                Produk
                <ProductSelect
                  products={products}
                  value={row.product}
                  onChange={(v) => update(i, { product: v })}
                />
              </label>
              <label>
                Jumlah dipesan {picked ? `(${picked.uom})` : ""}
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.qty_ordered}
                  onChange={(e) => update(i, { qty_ordered: e.target.value })}
                  placeholder="0"
                  required
                />
              </label>
              <label>
                Jumlah diterima {picked ? `(${picked.uom})` : ""}
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.qty_actual}
                  onChange={(e) => update(i, { qty_actual: e.target.value })}
                  placeholder="0"
                  required
                />
              </label>
              {showCost ? (
                <label>
                  Harga beli per satuan dasar (Rp)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.purchase_price}
                    onChange={(e) => update(i, { purchase_price: e.target.value })}
                    placeholder="0"
                  />
                </label>
              ) : null}
              <label className={showCost ? "wide" : undefined}>
                Catatan baris
                <input
                  value={row.notes}
                  onChange={(e) => update(i, { notes: e.target.value })}
                  placeholder="Opsional"
                />
              </label>
              {rows.length > 1 ? (
                <div className="wide">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
                  >
                    Hapus baris
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="wide">
        <button
          type="button"
          className="secondary"
          id="addline"
          onClick={() => onChange([...rows, emptyGrItem()])}
        >
          + Tambah baris
        </button>
      </div>
    </>
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
    <>
      <div className="wide" id="lines">
        <h2>Rincian barang</h2>
        {rows.map((row, i) => {
          const picked = products.find((p) => p.id === row.product);
          return (
            <div key={i} className="lineform">
              <label>
                Produk
                <ProductSelect
                  products={products}
                  value={row.product}
                  onChange={(v) => update(i, { product: v })}
                />
              </label>
              <label>
                Jumlah pesanan {picked ? `(${picked.uom})` : ""}
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.qty}
                  onChange={(e) => update(i, { qty: e.target.value })}
                  placeholder="0"
                  required
                />
              </label>
              <label>
                Jumlah diserahkan {picked ? `(${picked.uom})` : ""}
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.qty_delivered}
                  onChange={(e) => update(i, { qty_delivered: e.target.value })}
                  placeholder="0"
                  required
                />
              </label>
              {rows.length > 1 ? (
                <div className="wide">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
                  >
                    Hapus baris
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="wide">
        <button
          type="button"
          className="secondary"
          id="addline"
          onClick={() => onChange([...rows, emptyDeliveryItem()])}
        >
          + Tambah baris
        </button>
      </div>
    </>
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

  return (
    <>
      <div className="wide" id="lines">
        <h2>Rincian barang</h2>
        {rows.map((row, i) => {
          const picked = products.find((p) => p.id === row.product);
          const q = num(row.qty);
          const price = num(row.unit_price);
          const disc = num(row.discount_amount);
          const lineNet = Math.max(0, q * price - disc);

          return (
            <div key={i} className="lineform">
              <label>
                Produk
                <ProductSelect
                  products={products}
                  value={row.product}
                  onChange={(v) => {
                    const found = products.find((p) => p.id === v);
                    update(i, {
                      product: v,
                      ...(found && !row.unit_price
                        ? { unit_price: String(found.selling_price) }
                        : {}),
                    });
                    if (v !== "") onProductPick?.(v);
                  }}
                />
              </label>
              <label>
                Jumlah {picked ? `(${picked.uom})` : ""}
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={row.qty}
                  onChange={(e) => update(i, { qty: e.target.value })}
                  required
                />
              </label>
              <label>
                Harga per satuan dasar (Rp)
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={row.unit_price}
                  onChange={(e) => update(i, { unit_price: e.target.value })}
                  placeholder="Gunakan harga bertingkat"
                />
              </label>
              <label>
                Diskon total baris (Rp)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.discount_amount || "0"}
                  onChange={(e) => update(i, { discount_amount: e.target.value })}
                />
              </label>
              <output className="line-subtotal wide">
                {picked && q > 0
                  ? `${q} ${picked.uom} × ${rupiah(price)}${
                      disc > 0 ? ` − diskon ${rupiah(disc)}` : ""
                    } = ${rupiah(lineNet)}`
                  : "Pilih produk dan isi jumlah untuk melihat subtotal."}
              </output>
              {rows.length > 1 ? (
                <div className="wide">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
                  >
                    Hapus baris
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="wide">
        <button
          type="button"
          className="secondary"
          id="addline"
          onClick={() => onChange([...rows, emptyInvoiceItem()])}
        >
          + Tambah baris
        </button>
      </div>
    </>
  );
}
