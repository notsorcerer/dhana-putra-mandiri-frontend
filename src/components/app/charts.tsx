"use client";

import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { rupiah, rupiahCompact } from "@/lib/format";
import type { PieSlice, SalesTrendPoint } from "@/types/api";

const PIE_COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#0d9488", "#7c3aed", "#db2777", "#65a30d"];

/** Grafik garis tren penjualan & laba kotor 12 bulan. */
export function SalesTrendChart({ trends }: { trends: SalesTrendPoint[] }) {
  const data = trends.map((t) => ({
    bulan: t.month_name.slice(0, 3),
    penjualan: t.total_sales,
    labaKotor: t.gross_profit,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tren Penjualan 12 Bulan</CardTitle>
        <CardDescription>Pendapatan dan laba kotor per bulan (Rupiah)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v: number) => rupiahCompact(v)} tick={{ fontSize: 11 }} width={72} />
              <Tooltip
                formatter={(value) => rupiah(Number(value ?? 0))}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="penjualan"
                name="Penjualan"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="labaKotor"
                name="Laba Kotor"
                stroke="#16a34a"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface PieChartCardProps {
  title: string;
  description: string;
  data: PieSlice[];
}

/** Grafik pie distribusi (merek / ukuran kemasan). */
export function DistributionPieChart({ title, description, data }: PieChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="percentage"
                nameKey="label"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.label} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => {
                  const label = String(name ?? "");
                  return [
                    `${Number(value ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 2 })}% · ${data.find((d) => d.label === label)?.stock_qty ?? 0} unit`,
                    label,
                  ];
                }}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
