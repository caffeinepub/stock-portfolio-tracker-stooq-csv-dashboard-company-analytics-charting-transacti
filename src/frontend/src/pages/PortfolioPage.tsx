import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, PieChart, TrendingDown, TrendingUp } from "lucide-react";
import { usePortfolio } from "../hooks/usePortfolio";
import { useTickerMapping } from "../hooks/useTickerMapping";

export function PortfolioPage() {
  const navigate = useNavigate();
  const { summary, isLoading, hasError } = usePortfolio();
  const [companies] = useTickerMapping();

  const getCompanyName = (ticker: string) => {
    return companies.find((c) => c.ticker === ticker)?.companyName || ticker;
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-ocid="portfolio.loading_state">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Portefeuille</h1>
        <Alert variant="destructive" data-ocid="portfolio.error_state">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erreur lors du chargement du portefeuille
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!summary || summary.positions.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Portefeuille</h1>
        <div
          className="flex flex-col items-center justify-center py-24 text-center"
          data-ocid="portfolio.empty_state"
        >
          <PieChart className="h-14 w-14 text-muted-foreground/20 mb-4" />
          <p className="font-medium text-muted-foreground">
            Aucune transaction enregistrée
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Ajoutez des transactions depuis la page d'une entreprise pour voir
            votre portefeuille
          </p>
          <Button
            variant="link"
            className="mt-2"
            onClick={() => navigate({ to: "/" })}
            data-ocid="portfolio.link"
          >
            Parcourir les entreprises →
          </Button>
        </div>
      </div>
    );
  }

  const totalPL = summary.totalPL;
  const isPositive = totalPL >= 0;

  const summaryCards = [
    {
      label: "Valeur totale",
      value: `${summary.totalValue.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`,
      sub: `Coût: ${summary.totalCost.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`,
    },
    {
      label: "P&L Global",
      value: `${isPositive ? "+" : ""}${totalPL.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`,
      sub: `${isPositive ? "+" : ""}${summary.totalPLPercent.toFixed(2)}%`,
      isChange: true,
      isPositive,
    },
    {
      label: "Positions",
      value: summary.positions.length.toString(),
      sub: "actives",
    },
    {
      label: "P&L Réalisé",
      value: (() => {
        const rpl = summary.positions.reduce((sum, p) => sum + p.realizedPL, 0);
        return `${rpl >= 0 ? "+" : ""}${rpl.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;
      })(),
      isChange: true,
      isPositive:
        summary.positions.reduce((sum, p) => sum + p.realizedPL, 0) >= 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Portefeuille</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {summary.positions.length} position
          {summary.positions.length > 1 ? "s" : ""} active
          {summary.positions.length > 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 px-4">
              <p
                className={`text-xl font-bold font-mono ${
                  card.isChange
                    ? card.isPositive
                      ? "text-emerald-500"
                      : "text-red-500"
                    : ""
                }`}
              >
                {card.value}
              </p>
              {card.sub && (
                <p
                  className={`text-xs mt-1 ${
                    card.isChange
                      ? card.isPositive
                        ? "text-emerald-500/70"
                        : "text-red-500/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {card.sub}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="overflow-x-auto">
        <Card>
          <CardHeader>
            <CardTitle>Positions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table data-ocid="portfolio.table">
              <TableHeader>
                <TableRow>
                  <TableHead>Entreprise</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                  <TableHead className="hidden md:table-cell text-right">
                    Prix moy.
                  </TableHead>
                  <TableHead className="hidden md:table-cell text-right">
                    Prix act.
                  </TableHead>
                  <TableHead className="text-right">Valeur</TableHead>
                  <TableHead className="text-right">P&L</TableHead>
                  <TableHead className="text-right">P&L %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.positions.map((position, i) => {
                  const plColor =
                    position.unrealizedPL >= 0
                      ? "text-emerald-500"
                      : "text-red-500";
                  const Icon =
                    position.unrealizedPL >= 0 ? TrendingUp : TrendingDown;

                  return (
                    <TableRow
                      key={position.ticker}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() =>
                        navigate({
                          to: "/company/$ticker",
                          params: { ticker: position.ticker },
                        })
                      }
                      data-ocid={`portfolio.row.${i + 1}`}
                    >
                      <TableCell>
                        <div>
                          <span className="font-medium text-sm">
                            {getCompanyName(position.ticker)}
                          </span>
                          <p className="font-mono text-xs text-muted-foreground">
                            {position.ticker}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {position.sharesHeld.toFixed(4)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-right font-mono text-sm">
                        {position.avgBuyPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-right font-mono text-sm">
                        {position.currentPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {position.currentValue.toFixed(2)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono text-sm ${plColor}`}
                      >
                        <span className="flex items-center justify-end gap-1">
                          <Icon className="h-3 w-3" />
                          {position.unrealizedPL >= 0 ? "+" : ""}
                          {position.unrealizedPL.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono text-sm font-semibold ${plColor}`}
                      >
                        {position.unrealizedPLPercent >= 0 ? "+" : ""}
                        {position.unrealizedPLPercent.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
