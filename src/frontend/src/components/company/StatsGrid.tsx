import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { Statistics } from "../../lib/analytics";

interface StatsGridProps {
  stats: Statistics;
  loading?: boolean;
}

const SKELETON_ITEMS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

function ChangeValue({
  value,
  suffix = "%",
}: { value: number | null; suffix?: string }) {
  if (value === null) return <span className="text-muted-foreground">N/A</span>;
  const isPos = value >= 0;
  const isZero = Math.abs(value) < 0.01;
  return (
    <span
      className={`flex items-center gap-1 font-mono ${
        isZero
          ? "text-muted-foreground"
          : isPos
            ? "text-emerald-500 dark:text-emerald-400"
            : "text-red-500 dark:text-red-400"
      }`}
    >
      {isZero ? (
        <Minus className="h-3 w-3" />
      ) : isPos ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {isPos && !isZero ? "+" : ""}
      {value.toFixed(2)}
      {suffix}
    </span>
  );
}

export function StatsGrid({ stats, loading }: StatsGridProps) {
  if (loading) {
    return (
      <div
        className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
        data-ocid="stats.loading_state"
      >
        {SKELETON_ITEMS.map((n) => (
          <div
            key={n}
            className="rounded-lg border border-border bg-card p-3 space-y-2"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    );
  }

  const priceVal =
    stats.latestClose !== null ? (
      <span className="font-mono text-lg font-bold">
        {stats.latestClose.toFixed(2)}
      </span>
    ) : (
      <span className="text-muted-foreground">N/A</span>
    );

  const items = [
    { label: "Prix actuel", value: priceVal },
    { label: "Variation 1M", value: <ChangeValue value={stats.change1M} /> },
    { label: "Variation 3M", value: <ChangeValue value={stats.change3M} /> },
    { label: "Variation 1A", value: <ChangeValue value={stats.change1Y} /> },
    { label: "Variation 5A", value: <ChangeValue value={stats.change5Y} /> },
    {
      label: "+Haut 52S",
      value:
        stats.high52W !== null ? (
          <span className="font-mono text-emerald-500">
            {stats.high52W.toFixed(2)}
          </span>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        ),
    },
    {
      label: "+Bas 52S",
      value:
        stats.low52W !== null ? (
          <span className="font-mono text-red-500">
            {stats.low52W.toFixed(2)}
          </span>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        ),
    },
    {
      label: "MA 50j",
      value:
        stats.ma50 !== null ? (
          <span className="font-mono text-orange-400">
            {stats.ma50.toFixed(2)}
          </span>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        ),
    },
    {
      label: "MA 200j",
      value:
        stats.ma200 !== null ? (
          <span className="font-mono text-purple-400">
            {stats.ma200.toFixed(2)}
          </span>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        ),
    },
    {
      label: "Volatilité",
      value: (
        <span className="font-mono">
          {stats.volatility !== null
            ? `${stats.volatility.toFixed(1)}%`
            : "N/A"}
        </span>
      ),
    },
    {
      label: "Drawdown 1A",
      value: <ChangeValue value={stats.maxDrawdown1Y} />,
    },
    {
      label: "Drawdown 5A",
      value: <ChangeValue value={stats.maxDrawdown5Y} />,
    },
  ];

  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-border bg-card p-3"
        >
          <p className="text-xs text-muted-foreground mb-1.5">{item.label}</p>
          <div className="text-sm font-semibold">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
