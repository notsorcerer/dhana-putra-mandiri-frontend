/** Baris pasangan label–nilai untuk halaman detail dokumen. */
export function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <div className="text-sm font-medium">{value ?? "-"}</div>
    </div>
  );
}
