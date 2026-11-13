"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { rupiah } from "@/lib/format";
import type { PieSlice, SalesTrendPoint } from "@/types/api";

/** Palet grafik prototipe lama (biru penjualan, teal HPP). */
const PIE_COLORS = [
  "#2255dc",
  "#008376",
  "#a64720",
  "#087568",
  "#56667c",
  "#8da9f1",
  "#73dfc2",
  "#c6cfdd",
];

const compactFmt = new Intl.NumberFormat("id-ID", {
  notation: "compact",
  maximumFractionDigits: 1,
});

interface ChartPoint {
  label: string;
  sales: number;
  cost: number;
}

/**
 * Panel tren penjualan: SVG kustom paritas 100% dengan static/chart.js
 * pada prototipe lama (garis putus-putus, area #sales-fill hanya pada penjualan,
 * titik lingkaran putih r=3, pemilih mode #chart-mode, dan output.chart-tip).
 */
export function SalesTrendChart({ trends }: { trends: SalesTrendPoint[] }) {
  const [mode, setMode] = useState<"day" | "week">("day");
  const [width, setWidth] = useState(560);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const update = () => {
      setWidth(Math.max(240, el.clientWidth - 26));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const data = useMemo<ChartPoint[]>(() => {
    const raw: ChartPoint[] = trends.map((t) => ({
      label: t.month_name ? t.month_name.slice(0, 3) : t.period || String(t.month).padStart(2, "0"),
      sales: t.total_sales,
      cost: t.total_cogs,
    }));
    if (mode === "day" || raw.length <= 3) return raw;
    // Agregasi per kuartal/kelompok saat mode kedua dipilih
    const grouped: ChartPoint[] = [];
    for (let i = 0; i < raw.length; i += 3) {
      const slice = raw.slice(i, i + 3);
      grouped.push({
        label:
          slice.length > 1
            ? `${slice[0].label}–${slice[slice.length - 1].label}`
            : slice[0].label,
        sales: slice.reduce((acc, item) => acc + item.sales, 0),
        cost: slice.reduce((acc, item) => acc + item.cost, 0),
      });
    }
    return grouped;
  }, [trends, mode]);

  const left = 46;
  const right = width - 15;
  const top = 12;
  const base = 126;

  const range = data.flatMap((d) => [d.sales, d.cost]);
  const min = Math.min(0, ...range);
  const max = Math.max(1, ...range);

  const x = (i: number) =>
    data.length <= 1
      ? (left + right) / 2
      : left + ((right - left) * i) / (data.length - 1);
  const y = (v: number) => base - ((base - top) * (v - min)) / (max - min);

  const salesLine = data
    .map((d, i) => `${i ? "L" : "M"}${x(i)} ${y(d.sales)}`)
    .join(" ");
  const salesArea =
    data.length > 0
      ? `${salesLine} L${x(data.length - 1)} ${y(0)} L${x(0)} ${y(0)}Z`
      : "";
  const costLine = data
    .map((d, i) => `${i ? "L" : "M"}${x(i)} ${y(d.cost)}`)
    .join(" ");

  const slots = Math.max(2, Math.min(7, Math.floor((right - left) / 48)));
  const tickIndices =
    data.length > 0
      ? Array.from(
          new Set(
            Array.from({ length: Math.min(slots, data.length) }, (_, k) =>
              data.length === 1
                ? 0
                : Math.round((k * (data.length - 1)) / (Math.min(slots, data.length) - 1)),
            ),
          ),
        )
      : [];

  const step = (right - left) / Math.max(1, data.length - 1);
  const activeDatum = activeIdx !== null ? data[activeIdx] : null;

  return (
    <section className="panel chartpanel">
      <div className="panelhead">
        <div>
          <h2>Tren penjualan</h2>
          <p>Penjualan bersih dan harga pokok</p>
        </div>
        <label className="chart-mode">
          <span className="sr-only">Agregasi grafik</span>
          <select
            id="chart-mode"
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as "day" | "week");
              setActiveIdx(null);
            }}
          >
            <option value="day">Harian</option>
            <option value="week">Mingguan</option>
          </select>
        </label>
      </div>
      <div className="chartkey">
        <span>
          <i />
          Penjualan bersih
        </span>
        <span>
          <i />
          HPP
        </span>
      </div>
      <div
        id="chart"
        ref={chartRef}
        tabIndex={0}
        role="img"
        aria-label="Tren penjualan bersih dan HPP pada periode pilihan"
        onFocus={() => {
          if (data.length > 0 && activeIdx === null) setActiveIdx(0);
        }}
        onBlur={() => setActiveIdx(null)}
        onKeyDown={(e) => {
          if (data.length === 0) return;
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            const current = activeIdx ?? 0;
            const next = Math.min(
              data.length - 1,
              Math.max(0, current + (e.key === "ArrowRight" ? 1 : -1)),
            );
            setActiveIdx(next);
          }
        }}
      >
        {data.length > 0 ? (
          <svg
            viewBox={`0 0 ${width} 156`}
            preserveAspectRatio="none"
            onPointerLeave={() => setActiveIdx(null)}
          >
            {[0, 1, 2, 3].map((i) => {
              const value = min + ((max - min) * i) / 3;
              const yPos = y(value);
              return (
                <g key={i}>
                  <line
                    x1={left}
                    x2={right}
                    y1={yPos}
                    y2={yPos}
                    stroke="var(--line)"
                    strokeDasharray="3 4"
                  />
                  <text
                    x={left - 7}
                    y={yPos + 3}
                    textAnchor="end"
                    fontSize={10}
                    fill="var(--muted-legacy)"
                  >
                    {compactFmt.format(value)}
                  </text>
                </g>
              );
            })}

            <defs>
              <linearGradient id="sales-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-sales)" stopOpacity={0.27} />
                <stop offset="100%" stopColor="var(--chart-sales)" stopOpacity={0.015} />
              </linearGradient>
            </defs>

            <path d={salesArea} fill="url(#sales-fill)" />
            <path d={salesLine} fill="none" stroke="var(--chart-sales)" strokeWidth={2.5} />
            {data.length <= 32 &&
              data.map((d, i) => (
                <circle
                  key={`s-${i}`}
                  cx={x(i)}
                  cy={y(d.sales)}
                  r={3}
                  fill="white"
                  stroke="var(--chart-sales)"
                  strokeWidth={1.7}
                />
              ))}

            <path d={costLine} fill="none" stroke="var(--chart-cost)" strokeWidth={2.5} />
            {data.length <= 32 &&
              data.map((d, i) => (
                <circle
                  key={`c-${i}`}
                  cx={x(i)}
                  cy={y(d.cost)}
                  r={3}
                  fill="white"
                  stroke="var(--chart-cost)"
                  strokeWidth={1.7}
                />
              ))}

            {tickIndices.map((idx) => (
              <text
                key={`t-${idx}`}
                x={x(idx)}
                y={148}
                fontSize={10}
                fill="var(--muted-legacy)"
                textAnchor="middle"
              >
                {data[idx].label}
              </text>
            ))}

            {activeIdx !== null && (
              <line
                x1={x(activeIdx)}
                x2={x(activeIdx)}
                y1={top}
                y2={base}
                stroke="var(--quiet)"
                strokeDasharray="3 3"
              />
            )}

            {data.map((_, i) => {
              const hitX = Math.max(left, x(i) - step / 2);
              const hitW =
                data.length === 1
                  ? right - left
                  : Math.min(right, x(i) + step / 2) - hitX;
              return (
                <rect
                  key={`hit-${i}`}
                  x={hitX}
                  y={top}
                  width={Math.max(8, hitW)}
                  height={base - top}
                  fill="transparent"
                  onPointerEnter={() => setActiveIdx(i)}
                />
              );
            })}
          </svg>
        ) : null}

        <output className="chart-tip" hidden={!activeDatum}>
          {activeDatum
            ? `${activeDatum.label} · Penjualan ${rupiah(activeDatum.sales)} · HPP ${rupiah(activeDatum.cost)}`
            : ""}
        </output>
      </div>
      <Link className="panel-link" href="/reports/sales-trends">
        Buka laporan keuangan <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}

interface PieChartCardProps {
  title: string;
  description: string;
  data: PieSlice[];
}

/** Panel distribusi nilai persediaan (merek / ukuran kemasan). */
export function DistributionPieChart({ title, description, data }: PieChartCardProps) {
  return (
    <section className="panel">
      <div className="panelhead">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <div className="h-64 w-full px-4 pb-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="percentage"
              nameKey="label"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              isAnimationActive={false}
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
              contentStyle={{ borderRadius: 6, fontSize: 12, borderColor: "#dbe1e9" }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
