"use client";

import { useState } from "react";
import { toast } from "sonner";
import { StatusBadge, statusLabel } from "@/components/app/status-badge";
import { ApiError, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { dateTimeId, rupiah } from "@/lib/format";
import { CAN, can } from "@/lib/menu";
import { useApi, usePaginated } from "@/lib/use-api";
import type { AccountingPeriod, BalanceSheet } from "@/types/api";

type PeriodAction = "submit_period" | "close_period" | "reopen_period";

/**
 * Halaman Rekonsiliasi dan Tutup Buku:
 * paritas penuh dengan templates/period.html.
 */
export default function AccountingPeriodsPage() {
  const { session } = useAuth();
  const role = session?.role;
  const canManage = can(CAN.managePeriods, role);
  const canClose = can(CAN.closePeriods, role);

  const { data, loading, error, reload } = usePaginated<AccountingPeriod>(
    "/finance/accounting-periods/",
  );
  const balance = useApi<BalanceSheet>("/finance/reports/balance-sheet/");

  const periods = data?.results ?? [];
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const activePeriod =
    periods.find((p) => p.id === selectedId) ?? periods[0] ?? null;

  const handleAction = async (actionType: PeriodAction) => {
    if (!activePeriod) return;
    if (!note.trim()) {
      toast.error("Isi catatan pemeriksaan atau alasan terlebih dahulu.");
      return;
    }
    setBusy(true);
    try {
      const body: Record<string, unknown> =
        actionType === "close_period"
          ? { closing_notes: note, reason: note }
          : { reason: note };
      await apiPost(
        `/finance/accounting-periods/${activePeriod.id}/${actionType}/`,
        body,
      );
      toast.success(`Status periode ${activePeriod.period_name} diperbarui.`);
      setNote("");
      reload();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Gagal memproses periode akuntansi.",
        { duration: 8000 },
      );
    } finally {
      setBusy(false);
    }
  };

  const bs = balance.data;
  const reconItems = bs
    ? [
        { label: "Kas & Bank", value: bs.assets.kas_dan_bank.subtotal },
        { label: "Piutang", value: bs.assets.piutang_usaha },
        { label: "Utang", value: bs.liabilities.hutang_usaha_supplier },
        { label: "Persediaan", value: bs.assets.persediaan_barang_dagang },
      ]
    : [];

  return (
    <div>
      <h1>Rekonsiliasi dan tutup buku</h1>

      {periods.length > 0 ? (
        <form
          className="tools"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <label>
            Periode
            <select
              value={activePeriod?.id ?? ""}
              onChange={(e) => setSelectedId(Number(e.target.value))}
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.period_name} ({p.start_date} – {p.end_date})
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Tampilkan</button>
        </form>
      ) : null}

      {activePeriod ? (
        <form
          className="panel formgrid"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <h2 className="wide">
            {activePeriod.period_name} · {statusLabel(activePeriod.status)}
          </h2>

          {reconItems.map((item) => (
            <label key={item.label}>
              {item.label} · buku {rupiah(item.value)}
              {role === "accounting" && activePeriod.status === "OPEN" ? (
                <input
                  type="number"
                  defaultValue={Math.round(item.value)}
                  placeholder="Saldo hasil pemeriksaan"
                />
              ) : null}
            </label>
          ))}

          <label className="wide">
            Catatan pemeriksaan atau alasan
            <textarea
              name="note"
              required
              maxLength={300}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan hasil pemeriksaan rekonsiliasi atau alasan pembukaan kembali…"
            />
          </label>

          {canManage ? (
            <div className="wide inline-actions">
              {activePeriod.status === "OPEN" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleAction("submit_period")}
                >
                  Ajukan tutup buku
                </button>
              ) : null}
              {canClose && activePeriod.status !== "CLOSED" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleAction("close_period")}
                >
                  Setujui penutupan
                </button>
              ) : null}
              {canClose && activePeriod.status === "CLOSED" ? (
                <button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={() => handleAction("reopen_period")}
                >
                  Buka kembali
                </button>
              ) : null}
            </div>
          ) : null}
        </form>
      ) : null}

      <section className="panel pad">
        <h2>Riwayat periode</h2>
        {loading ? (
          <p>Memuat riwayat periode…</p>
        ) : error ? (
          <p className="errorlist">{error}</p>
        ) : periods.length === 0 ? (
          <p>Belum ada keputusan periode.</p>
        ) : (
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Periode</th>
                  <th>Rentang</th>
                  <th>Status</th>
                  <th>Ditutup oleh</th>
                  <th>Catatan / alasan</th>
                </tr>
              </thead>
              <tbody>
                {periods.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <a
                        href="#top"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedId(p.id);
                        }}
                      >
                        {p.period_name}
                      </a>
                    </td>
                    <td>
                      {p.start_date} – {p.end_date}
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td>
                      {p.closed_by_name
                        ? `${p.closed_by_name} · ${dateTimeId(p.closed_at)}`
                        : "—"}
                    </td>
                    <td>{p.closing_notes || p.reopen_reason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
