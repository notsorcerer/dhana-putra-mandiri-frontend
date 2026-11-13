# Frontend ERP — CV Dhana Putra Mandiri

Aplikasi web (frontend) untuk sistem ERP distribusi minyak goreng CV Dhana Putra Mandiri.
Frontend ini **terpisah dari backend** dan mengonsumsi REST API Django REST Framework
pada repo [`dhana-putra-mandiri-backend`](https://github.com/adamleonn/dhana-putra-mandiri-backend).

Seluruh antarmuka menggunakan **Bahasa Indonesia**, format **Rupiah (id-ID)**, dan menu/aksi
dibatasi mengikuti matriks RBAC backend (peran demo).

---

## Teknologi

| Komponen | Versi / Keterangan |
| --- | --- |
| Next.js | 16.x (App Router, Turbopack) |
| React | 19.x |
| TypeScript | 5.x (strict) |
| Tailwind CSS | 4.x |
| shadcn/ui | Komponen Radix + Tailwind (`src/components/ui`) |
| Recharts | Grafik tren penjualan & distribusi persediaan |
| Sonner | Notifikasi toast |

---

## Prasyarat

- **Node.js 20+** dan npm
- **Python 3.11+** (untuk backend)
- Backend ERP berjalan lokal di `http://localhost:8000`

---

## 1. Menjalankan Backend

Repo backend terpisah (tidak diubah oleh frontend ini). Ringkasan setup demo:

```bash
git clone https://github.com/adamleonn/dhana-putra-mandiri-backend.git
cd dhana-putra-mandiri-backend

python -m venv venv
# Windows
.\venv\Scripts\activate
pip install -r requirements.txt

# .env untuk mode demo SQLite
# DB_ENGINE=django.db.backends.sqlite3
# DEMO_MODE=True

python manage.py migrate
python manage.py seed_initial_data
python manage.py seed_demo_data
python manage.py runserver 127.0.0.1:8000
```

Backend menyediakan token demo Bearer (aktif saat `DEMO_MODE=True`) dan mengizinkan
CORS dari `http://localhost:3000`.

> Catatan: frontend ini **tidak** mengubah kode backend. Semua temuan bug/keterbatasan
> didokumentasikan di bagian [Catatan Integrasi](#catatan-integrasi-penting).

---

## 2. Menjalankan Frontend

```bash
git clone <url-repo-frontend>
cd dhana-putra-mandiri-frontend

npm install
cp .env.local.example .env.local
# sesuaikan bila backend bukan di localhost:8000
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api

npm run dev
```

Buka **http://localhost:3000**.

Build produksi:

```bash
npm run build
npm run start
```

---

## 3. Login Demo & Peran

Halaman login menyediakan **pemilih peran demo** (tanpa kata sandi). Frontend menyimpan
token Bearer di `localStorage` (`dpm_auth`) dan mengirimnya pada setiap request.

| Peran | Token demo | Fokus akses |
| --- | --- | --- |
| Direktur | `demo-direktur` | Semua modul & aksi |
| Admin | `demo-admin` | Faktur + item, pembayaran, lihat GR/DN/COA/payroll |
| Sales | `demo-sales` | Faktur penjualan + item (tanpa HPP) |
| Gudang | `demo-gudang` | Penerimaan barang, surat jalan + konfirmasi |
| Kasir (Finance) | `demo-kasir` | Pembayaran (BKM/BKK), lihat faktur/GR/DN/COA/payroll |
| Accounting | `demo-accounting` | Debit note, buku besar, COA, periode, payroll, SDM |
| Stakeholder | `demo-stakeholder` | Baca laporan & master (tanpa pembayaran/SDM) |

Menu sidebar dan tombol aksi disembunyikan sesuai peran. **Otorisasi sesungguhnya tetap
ditegakkan backend** — frontend hanya menyembunyikan elemen yang tidak berhak.

---

## 4. Cakupan Modul

### Inventori
- **Produk** — daftar, tambah/ubah (Direktur), ABC class, harga jual/HPP (disembunyikan per peran)
- **Analisis ABC** — nilai persediaan & kelas ABC
- **Estimasi Stok** — hari persediaan tersisa, penanda stok < 28 hari
- **Pergerakan Stok** — riwayat IN/OUT per produk
- **Penerimaan Barang** — daftar, buat (dengan editor item), detail, konfirmasi
- **Surat Jalan** — daftar, buat (editor item), detail, konfirmasi (dialog konflik stok 409), cetak

### Keuangan
- **Pelanggan & Pemasok** — master data (ubah: Direktur)
- **Faktur Penjualan** — daftar, buat (editor item + tautan surat jalan), detail
  (pembayaran terkait dihitung client-side), penanda jatuh tempo
- **Pembayaran** — BKM/BKK dengan field dinamis per kategori, akun kas/bank, tautan faktur/GR
- **Debit Note** — daftar & buat (hanya GR dengan selisih kuantitas)
- **Buku Besar** — jurnal otomatis + dialog baris debit/kredit
- **Bagan Akun (COA)** — daftar & tambah akun (Accounting/Direktur)
- **Periode Akuntansi** — tutup, buka ulang (wajib alasan), ajukan review

### Laporan
- **Neraca** — per `as_of_date`
- **Tren Penjualan 12 Bulan** — grafik garis + tabel bulanan per `year`
- **Penjualan & Margin Produk** — peringkat SKU per `year`
- **Ringkasan Keuangan Tahunan** — laba rugi ringkas, rincian bulanan, 5 produk teratas
- **Distribusi Persediaan** — pie chart per merek & ukuran kemasan

### SDM (HR)
- **Karyawan** — daftar, tambah/ubah, detail (riwayat mutasi & catatan kerja)
- **Mutasi Karyawan** — promosi/demosi/transfer/penyesuaian gaji
- **Catatan Kerja** — kehadiran, lembur, insiden, SP, apresiasi
- **Payroll** — generate slip (Accounting/Direktur), bayarkan/disburse (Kasir/Admin/Direktur)
  dengan pemilihan akun kas/bank dan posting jurnal otomatis

### Dashboard
Adaptif per peran: KPI penjualan/piutang/stok, tren penjualan, distribusi persediaan,
estimasi stok, dan pintasan modul sesuai hak akses.

---

## 5. Matriks Akses (ringkas)

| Aksi | Direktur | Admin | Sales | Gudang | Kasir | Accounting | Stakeholder |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| Produk (ubah) | ✓ | – | – | – | – | – | – |
| GR / Surat Jalan (buat, konfirmasi) | ✓ | – | – | ✓ | – | – | – |
| Faktur Penjualan (buat) | ✓ | ✓ | ✓ | – | – | – | – |
| Pembayaran (buat) | ✓ | ✓ | – | – | ✓ | – | – |
| Debit Note (buat) | ✓ | – | – | – | – | ✓ | – |
| Buku Besar | ✓ | – | – | – | ✓ | ✓ | – |
| COA (tambah) | ✓ | – | – | – | – | ✓ | – |
| Periode Akuntansi | ✓ | – | – | – | – | ✓ | – |
| Karyawan / Mutasi / Catatan Kerja | ✓ | – | – | – | – | ✓ | – |
| Payroll (generate) | ✓ | – | – | – | – | ✓ | – |
| Payroll (disburse) | ✓ | ✓ | – | – | ✓ | – | – |
| Laporan | ✓ | ✓ | – | – | ✓ | ✓ | ✓ |

Matriks ini diturunkan dari permission group backend dan **diverifikasi langsung** terhadap
API (termasuk 403 untuk peran yang tidak berhak).

---

## 6. Catatan Integrasi Penting

### 6.1 Bug backend: POST dokumen dengan `items` → HTTP 500

**Gejala:** `POST /api/inventory/goods-receipts/`, `/api/inventory/deliveries/`, dan
`/api/finance/sales-invoices/` dengan field nested `items` mengembalikan **HTTP 500
(TypeError)**. Tanpa `items`, dokumen tersimpan sebagai draft (201). `PATCH` dengan `items`
juga gagal (AssertionError). Konfirmasi dokumen tanpa item ditolak backend
(`"Cannot confirm ... with no items."`).

**Perilaku frontend:** form tetap mengirim `items` sesuai kontrak API. Bila backend
merespons 500, helper `postDocumentWithItems()` otomatis **mengulang tanpa `items`**
(tidak ada data yang tersimpan pada respons 500) dan menampilkan peringatan bahwa
dokumen tersimpan tanpa item. Item kemudian tidak dapat ditambahkan karena PATCH juga
terdampak bug.

**Saran perbaikan backend (satu baris):** pada serializer/viewset terkait, buang `items`
dari `validated_data` sebelum `Model.objects.create()` (mis.
`validated_data.pop('items', None)`), lalu simpan item secara terpisah. Perbaikan ini
**tidak dilakukan** di repo backend karena repo tersebut tidak boleh diubah dalam proyek ini.

### 6.2 `paid_amount` faktur tidak diperbarui oleh pembayaran

`POST /api/finance/payments/` berhasil (201) dan memposting jurnal, tetapi **tidak**
memperbarui `paid_amount` pada faktur. Halaman detail faktur menghitung total terbayar
dan sisa dari pembayaran yang menautkan faktur tersebut (client-side). Data pembayaran
hanya dimuat untuk peran dengan akses baca pembayaran (Direktur, Admin, Kasir, Accounting).

### 6.3 Pihak terkait pembayaran wajib berupa ID FK

`PaymentSerializer` **tidak** memiliki field string `customer_name`/`supplier_name`.
Form pembayaran mengirim `customer` / `supplier` sebagai **id** dari master data.
Field string akan diabaikan diam-diam oleh DRF.

### 6.4 Nomor dokumen wajib dikirim klien

`receipt_number`, `delivery_number`, `invoice_number`, `payment_number`,
`debit_note_number`, dan `employee_id` wajib diisi. Frontend menyarankan nomor unik
`PREFIX-WEB-YYYYMMDD-HHMMSS` yang dapat diedit. Backend sendiri memakai pola
`TIPE/YYYYMM/0000` untuk dokumen yang dibuat lewat aksi internal.

### 6.5 Desimal, pagination, dan pencarian

- Semua `DecimalField` diterima sebagai **string** (mis. `"420.00"`) → gunakan helper `num()`.
- DRF `PageNumberPagination` (`PAGE_SIZE = 20`): `{ count, next, previous, results }`,
  navigasi hanya `?page=N`.
- Kotak pencarian di tabel memfilter **halaman yang sedang tampil** (client-side),
  bukan seluruh dataset.

### 6.6 Parameter laporan

- Neraca: `?as_of_date=YYYY-MM-DD`
- Tren penjualan, penjualan produk, ringkasan tahunan: `?year=YYYY`
- Distribusi persediaan: tanpa parameter

### 6.7 Payroll

- **Generate**: `POST /api/hr/payroll-slips/generate/` dengan
  `{ employee, period_month, period_year, overtime_allowance, bonus_allowance, deductions, notes }`.
  Slip dibuat berstatus `draft`; generate ulang untuk periode yang sama memperbarui slip
  yang belum dibayar.
- **Disburse**: `POST /api/hr/payroll-slips/{id}/disburse/` dengan
  `{ disbursement_account_code: "1120" }` (**kode akun string**, bukan id). Aksi ini
  memposting jurnal beban gaji (6200) dan menandai slip `paid`.

---

## 7. Roadmap — Fitur Prototipe Tanpa API

Fitur berikut ada pada prototipe lama namun **belum memiliki endpoint backend**.
Sengaja belum diimplementasikan dan dicatat sebagai roadmap:

- Stock opname / penyesuaian fisik
- Retur penjualan pelanggan
- Saldo awal & jurnal pembuka
- Cicilan / uang muka / transfer antar rekening
- Fee pemasaran & komisi sales
- Rekonsiliasi bank (matching otomatis)
- Kelengkapan hari kerja & absensi terintegrasi
- Harga bertingkat per pelanggan/kuantitas
- Audit log perubahan data

---

## 8. Struktur Proyek

```
src/
├─ app/
│  ├─ (app)/                 # Halaman setelah login (app shell + sidebar)
│  │  ├─ page.tsx            # Dashboard adaptif peran
│  │  ├─ products/           # Produk, ABC, estimasi stok
│  │  ├─ stock-movements/
│  │  ├─ goods-receipts/     # List, new, [id]
│  │  ├─ deliveries/         # List, new, [id]
│  │  ├─ customers/ suppliers/
│  │  ├─ sales-invoices/     # List, new, [id]
│  │  ├─ payments/           # List, new
│  │  ├─ debit-notes/
│  │  ├─ general-ledger/
│  │  ├─ chart-of-accounts/
│  │  ├─ accounting-periods/
│  │  ├─ reports/            # Neraca, tren, produk, tahunan, pie
│  │  └─ hr/                 # Karyawan, mutasi, catatan kerja, payroll
│  └─ login/
├─ components/
│  ├─ app/                   # DataTable, PageHeader, StatusBadge, charts, dll.
│  └─ ui/                    # Komponen shadcn/ui
├─ lib/                      # api, auth, menu (RBAC), format, use-api, doc-submit
└─ types/api.ts              # Tipe respons REST API
```

---

## 9. Lisensi & Konteks

Proyek ini dibuat untuk keperluan tugas/akademik (Semester 7) dan demonstrasi integrasi
frontend–backend ERP. Token demo hanya berlaku saat backend berjalan dengan `DEMO_MODE=True`;
jangan gunakan konfigurasi demo di lingkungan produksi.
