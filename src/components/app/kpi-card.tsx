import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string;
  hint?: string;
  tone?: "default" | "positive" | "warning" | "negative";
  icon?: React.ReactNode;
}

const TONE_CLASS: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  default: "text-foreground",
  positive: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  negative: "text-red-600 dark:text-red-400",
};

/** Kartu indikator ringkas (KPI) untuk dashboard dan laporan. */
export function KpiCard({ title, value, hint, tone = "default", icon }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</p>
          <p className={cn("text-2xl font-semibold tabular-nums", TONE_CLASS[tone])}>{value}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      </CardContent>
    </Card>
  );
}
