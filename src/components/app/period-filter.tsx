"use client";

import { useRef, useState } from "react";
import { SvgIcon } from "@/components/app/svg-sprites";

function formatShortDate(iso: string, withYear: boolean): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  }).format(d);
}

interface PeriodFilterProps {
  defaultStart?: string;
  defaultEnd?: string;
  onApply?: (start: string, end: string) => void;
}

/**
 * Dropdown pemilih rentang tanggal (<details class="filter">),
 * paritas 100% dengan templates/filter.html pada prototipe lama.
 */
export function PeriodFilter({
  defaultStart,
  defaultEnd,
  onApply,
}: PeriodFilterProps) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");

  const [start, setStart] = useState(defaultStart ?? `${y}-${m}-01`);
  const [end, setEnd] = useState(defaultEnd ?? `${y}-${m}-${d}`);
  const [draftStart, setDraftStart] = useState(start);
  const [draftEnd, setDraftEnd] = useState(end);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStart(draftStart);
    setEnd(draftEnd);
    onApply?.(draftStart, draftEnd);
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  };

  return (
    <details ref={detailsRef} className="filter">
      <summary>
        <SvgIcon name="calendar" />
        {formatShortDate(start, false)} – {formatShortDate(end, true)} <span>⌄</span>
      </summary>
      <form onSubmit={handleSubmit}>
        <label>
          Mulai
          <input
            name="awal"
            type="date"
            value={draftStart}
            onChange={(e) => setDraftStart(e.target.value)}
            required
          />
        </label>
        <label>
          Sampai
          <input
            name="akhir"
            type="date"
            value={draftEnd}
            onChange={(e) => setDraftEnd(e.target.value)}
            required
          />
        </label>
        <button type="submit">Terapkan periode</button>
      </form>
    </details>
  );
}
