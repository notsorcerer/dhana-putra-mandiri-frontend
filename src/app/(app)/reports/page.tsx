"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { CAN, can, type Role } from "@/lib/menu";

const REPORTS: {
  href: string;
  code: string;
  title: string;
  description: string;
  roles: readonly Role[];
}[] = [
  {
    href: "/reports/sales-trends",
    code: "RPT-01",
    title: "Tren Penjualan 12 Bulan",
    description: "Pendapatan, volume, HPP, dan laba kotor bulanan untuk satu tahun terpilih.",
    roles: CAN.viewSalesReports,
  },
  {
    href: "/reports/balance-sheet",
    code: "RPT-02",
    title: "Neraca (Balance Sheet)",
    description: "Posisi keuangan: aktiva, kewajiban, dan ekuitas per tanggal tertentu.",
    roles: CAN.viewFinanceReports,
  },
  {
    href: "/reports/product-sales",
    code: "RPT-03",
    title: "Penjualan & Margin Produk",
    description: "Kinerja per SKU: kuantitas terjual, pendapatan, HPP, dan margin kotor per tahun.",
    roles: CAN.viewSalesReports,
  },
  {
    href: "/reports/annual",
    code: "RPT-04",
    title: "Ringkasan Keuangan Tahunan",
    description: "Laba kotor, beban operasional, dan laba bersih operasional dengan rincian bulanan.",
    roles: CAN.viewFinanceReports,
  },
  {
    href: "/reports/pie-charts",
    code: "RPT-05",
    title: "Distribusi Persediaan",
    description: "Proporsi nilai stok berdasarkan merek dan ukuran kemasan produk.",
    roles: CAN.viewFinanceReports,
  },
];

export default function ReportsIndexPage() {
  const { session } = useAuth();
  const rows = REPORTS.filter((r) => can(r.roles, session?.role));

  return (
    <section className="panel scroll">
      <div className="panelhead">
        <div>
          <h2>Daftar laporan manajemen</h2>
          <p>{rows.length} laporan tersedia sesuai hak akses peran Anda.</p>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Kode</th>
            <th>Nama Laporan</th>
            <th>Cakupan Analitik</th>
            <th>Tindakan</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((report) => (
            <tr key={report.href}>
              <td>
                <Link className="doclink" href={report.href}>
                  <strong>{report.code}</strong>
                </Link>
              </td>
              <td>{report.title}</td>
              <td>{report.description}</td>
              <td>
                <Link className="doclink" href={report.href}>
                  Buka laporan →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
