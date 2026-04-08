import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  CandlestickChart,
  LineChart,
} from "lucide-react";
import { useMemo, useState } from "react";
import { BuyTargetsPanel } from "../components/company/BuyTargetsPanel";
import { CompanyChart } from "../components/company/CompanyChart";
import { HorizontalLinesPanel } from "../components/company/HorizontalLinesPanel";
import { PositionSummary } from "../components/company/PositionSummary";
import { RangeSelector } from "../components/company/RangeSelector";
import { StatsGrid } from "../components/company/StatsGrid";
import { TransactionsTable } from "../components/company/TransactionsTable";
import { useBuyTargets } from "../hooks/useBuyTargets";
import { useChartPreferences } from "../hooks/useChartPreferences";
import { useHorizontalLines } from "../hooks/useHorizontalLines";
import { useStooqHistory } from "../hooks/useStooqHistory";
import { useTickerMapping } from "../hooks/useTickerMapping";
import { useTransactions } from "../hooks/useTransactions";
import { calculateStatistics } from "../lib/analytics";
import { calculatePositionMetrics } from "../lib/portfolioMath";
import type { TimeRange } from "../lib/types";
import { filterByTimeRange } from "../lib/yahooFinance";

export function CompanyDetailPage() {
  const { ticker } = useParams({ from: "/company/$ticker" });
  const navigate = useNavigate();
  const [companies] = useTickerMapping();
  const [range, setRange] = useState<TimeRange>("1Y");
  const [preferences, setPreferences] = useChartPreferences();

  const company = companies.find((c) => c.ticker === ticker);
  const { data: timeSeries, isLoading, error } = useStooqHistory(ticker);
  const { transactions, addTransaction, deleteTransaction } =
    useTransactions(ticker);
  const { lines, addLine, deleteLine } = useHorizontalLines(ticker);
  const { targets, addTarget, updateTarget, deleteTarget } =
    useBuyTargets(ticker);

  const filteredData = useMemo(() => {
    if (!timeSeries) return [];
    return filterByTimeRange(timeSeries.data, range);
  }, [timeSeries, range]);

  const stats = useMemo(() => {
    if (!timeSeries) return calculateStatistics([]);
    return calculateStatistics(timeSeries.data);
  }, [timeSeries]);

  const positionMetrics = useMemo(() => {
    if (!stats.latestClose || transactions.length === 0) return null;
    return calculatePositionMetrics(transactions, stats.latestClose);
  }, [transactions, stats.latestClose]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/" })}
            data-ocid="company.back.button"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>
        <div>
          <div className="h-7 w-48 rounded bg-muted animate-pulse" />
          <div className="h-4 w-24 rounded bg-muted animate-pulse mt-2" />
        </div>
        <StatsGrid stats={calculateStatistics([])} loading />
        <div
          className="h-80 w-full rounded-lg bg-muted animate-pulse"
          data-ocid="company.loading_state"
        />
      </div>
    );
  }

  if (error || !timeSeries) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/" })}
          data-ocid="company.back.button"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <Alert variant="destructive" data-ocid="company.error_state">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "Erreur lors du chargement des données Stooq"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/" })}
            className="mb-2 -ml-2"
            data-ocid="company.back.button"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {company?.country} {company?.companyName || ticker}
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono text-muted-foreground">
              {ticker}
            </code>
            {company && (
              <>
                <Badge variant="outline" className="text-xs">
                  {company.market}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {company.sector}
                </Badge>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap md:flex-nowrap items-center gap-3 shrink-0">
          <RangeSelector value={range} onChange={setRange} />
          <Tabs
            value={preferences.mode}
            onValueChange={(v) =>
              setPreferences({
                ...preferences,
                mode: v as "line" | "candlestick",
              })
            }
          >
            <TabsList className="h-8">
              <TabsTrigger
                value="line"
                className="h-7 px-3 text-xs gap-1"
                data-ocid="company.chart_line.tab"
              >
                <LineChart className="h-3 w-3" />
                Ligne
              </TabsTrigger>
              <TabsTrigger
                value="candlestick"
                className="h-7 px-3 text-xs gap-1"
                data-ocid="company.chart_candle.tab"
              >
                <CandlestickChart className="h-3 w-3" />
                Chandeliers
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <Switch
                id="ma50"
                checked={preferences.showMA50}
                onCheckedChange={(v) =>
                  setPreferences({ ...preferences, showMA50: v })
                }
                className="h-4 w-7"
                data-ocid="company.ma50.switch"
              />
              <Label htmlFor="ma50" className="text-orange-400 cursor-pointer">
                MA50
              </Label>
            </div>
            <div className="flex items-center gap-1.5">
              <Switch
                id="ma200"
                checked={preferences.showMA200}
                onCheckedChange={(v) =>
                  setPreferences({ ...preferences, showMA200: v })
                }
                className="h-4 w-7"
                data-ocid="company.ma200.switch"
              />
              <Label htmlFor="ma200" className="text-purple-400 cursor-pointer">
                MA200
              </Label>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <StatsGrid stats={stats} />

      {/* Position summary */}
      {positionMetrics && positionMetrics.sharesHeld > 0 && (
        <PositionSummary metrics={positionMetrics} />
      )}

      {/* Chart */}
      <CompanyChart
        data={filteredData}
        mode={preferences.mode}
        showMA50={preferences.showMA50}
        showMA200={preferences.showMA200}
        horizontalLines={lines}
        transactions={transactions}
      />

      {/* Panels */}
      <div className="grid gap-5 lg:grid-cols-2">
        <HorizontalLinesPanel
          lines={lines}
          onAdd={addLine}
          onDelete={deleteLine}
        />
        <BuyTargetsPanel
          targets={targets}
          transactions={transactions}
          onAdd={addTarget}
          onUpdate={updateTarget}
          onDelete={deleteTarget}
        />
      </div>

      <TransactionsTable
        transactions={transactions}
        onAdd={addTransaction}
        onDelete={deleteTransaction}
        ticker={ticker}
      />
    </div>
  );
}
