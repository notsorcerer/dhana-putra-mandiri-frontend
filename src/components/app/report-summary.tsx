"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SvgIcon } from "@/components/app/svg-sprites";
import { ApiError, apiGet, type QueryParams } from "@/lib/api";
import type { ReportSummary, ReportSummaryKind } from "@/types/api";

interface ReportSummaryProps {
  report: ReportSummaryKind;
  /** Parameter laporan yang sedang dibuka (mis. { year } atau { as_of_date }). */
  params?: QueryParams;
}

type Block = { heading: string | null; items: string[]; paragraphs: string[] };

/** Ubah keluaran "JUDUL:\n- poin" dari backend menjadi blok terstruktur. */
function parseSummary(text: string): Block[] {
  const blocks: Block[] = [];
  let current: Block = { heading: null, items: [], paragraphs: [] };
  const push = () => {
    if (current.heading || current.items.length || current.paragraphs.length) blocks.push(current);
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const heading = /^([A-Z][A-Z ]{2,}):\s*(.*)$/.exec(line);
    if (heading) {
      push();
      current = { heading: heading[1], items: [], paragraphs: heading[2] ? [heading[2]] : [] };
    } else if (line.startsWith("- ")) {
      current.items.push(line.slice(2));
    } else {
      current.paragraphs.push(line);
    }
  }
  push();
  return blocks;
}

function titleCase(heading: string): string {
  return heading.charAt(0) + heading.slice(1).toLowerCase();
}

/**
 * Panel asisten ringkasan laporan: tombol "Buat Ringkasan" memanggil
 * GET /finance/reports/summary/ yang merangkum data laporan aktif lewat SLM.
 */
export function ReportSummaryPanel({ report, params }: ReportSummaryProps) {
  const paramsKey = JSON.stringify(params ?? {});
  const [result, setResult] = useState<{ key: string; data: ReportSummary } | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  // Hasil/error hanya berlaku untuk parameter laporan saat dibuat.
  const data = result?.key === paramsKey ? result.data : null;
  const errorMessage = error?.key === paramsKey ? error.message : null;

  const generate = async () => {
    const id = ++requestId.current;
    const key = paramsKey;
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<ReportSummary>("/finance/reports/summary/", { report, ...params });
      if (id === requestId.current) setResult({ key, data: res });
    } catch (err) {
      if (id !== requestId.current) return;
      const message = err instanceof ApiError ? err.message : "Terjadi kesalahan yang tidak diketahui.";
      setError({ key, message });
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  };

  const blocks = data?.status === "ok" ? parseSummary(data.summary) : [];

  return (
    <section className="panel" aria-labelledby={`summary-${report}`}>
      <div className="panelhead">
        <div>
          <small>Asisten AI</small>
          <h2 id={`summary-${report}`}>Ringkasan laporan</h2>
          <p>Rangkuman otomatis poin penting dari data laporan yang sedang dibuka.</p>
        </div>
        <Button type="button" onClick={generate} disabled={loading} aria-busy={loading}>
          {loading ? "Memproses…" : data ? "Buat Ulang Ringkasan" : "Buat Ringkasan"}
        </Button>
      </div>

      <div aria-live="polite">
        {loading ? (
          <div className="empty-state">
            <SvgIcon name="clock" />
            <p>Sedang menyusun ringkasan dari data laporan… Proses ini dapat memakan beberapa detik.</p>
          </div>
        ) : errorMessage ? (
          <div className="empty-state">
            <SvgIcon name="alert" />
            <p className="text-destructive">{errorMessage}</p>
          </div>
        ) : data?.status === "insufficient" ? (
          <div className="empty-state">
            <SvgIcon name="doc" />
            <p>{data.message}</p>
          </div>
        ) : data ? (
          <div className="pad space-y-4 border-t border-border text-sm">
            <p className="text-muted-foreground">
              {data.title} · {data.period}
            </p>
            {blocks.map((block, i) => (
              <div key={`${block.heading ?? "p"}-${i}`}>
                {block.heading ? <h3 className="mb-1 font-semibold">{titleCase(block.heading)}</h3> : null}
                {block.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {block.items.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-5">
                    {block.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer">Data yang digunakan ({data.facts.length} fakta)</summary>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {data.facts.map((fact) => (
                  <li key={fact.text}>{fact.text}</li>
                ))}
              </ul>
            </details>
            <p className="text-xs text-muted-foreground">
              Dibuat oleh AI{data.model ? ` (${data.model})` : ""} hanya dari data laporan ini. Tetap periksa angka pada
              tabel sebelum mengambil keputusan.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
