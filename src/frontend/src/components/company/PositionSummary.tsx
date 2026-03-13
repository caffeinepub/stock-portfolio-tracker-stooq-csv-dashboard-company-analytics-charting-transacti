import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PositionMetrics } from "../../lib/types";

interface PositionSummaryProps {
  metrics: PositionMetrics | null;
}

export function PositionSummary({ metrics }: PositionSummaryProps) {
  if (!metrics || metrics.sharesHeld === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Position</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            Aucune position détenue
          </p>
        </CardContent>
      </Card>
    );
  }

  const items = [
    { label: "Actions détenues", value: metrics.sharesHeld.toFixed(2) },
    {
      label: "Prix moyen d'achat",
      value: `${metrics.avgBuyPrice.toFixed(2)} €`,
    },
    { label: "Prix actuel", value: `${metrics.currentPrice.toFixed(2)} €` },
    { label: "Valeur actuelle", value: `${metrics.currentValue.toFixed(2)} €` },
    { label: "Coût total", value: `${metrics.totalCost.toFixed(2)} €` },
    {
      label: "P&L latent",
      value: `${metrics.unrealizedPL >= 0 ? "+" : ""}${metrics.unrealizedPL.toFixed(2)} € (${metrics.unrealizedPLPercent >= 0 ? "+" : ""}${metrics.unrealizedPLPercent.toFixed(2)}%)`,
      color:
        metrics.unrealizedPL >= 0
          ? "text-green-600 dark:text-green-400"
          : "text-red-600 dark:text-red-400",
    },
    {
      label: "P&L réalisé",
      value: `${metrics.realizedPL >= 0 ? "+" : ""}${metrics.realizedPL.toFixed(2)} €`,
      color:
        metrics.realizedPL >= 0
          ? "text-green-600 dark:text-green-400"
          : "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Position</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.label} className="space-y-1">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className={`text-lg font-semibold ${item.color || ""}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
