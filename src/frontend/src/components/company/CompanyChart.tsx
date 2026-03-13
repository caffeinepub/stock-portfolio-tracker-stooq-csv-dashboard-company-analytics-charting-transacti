import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { calculateMAArray } from "../../lib/analytics";
import type { HorizontalLine, OHLCRow, Transaction } from "../../lib/types";

interface CompanyChartProps {
  data: OHLCRow[];
  mode: "line" | "candlestick";
  showMA50: boolean;
  showMA200: boolean;
  horizontalLines: HorizontalLine[];
  transactions: Transaction[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div className="rounded-lg border border-border bg-popover p-3 shadow-lg text-xs space-y-1">
      <p className="font-semibold text-popover-foreground mb-2">{label}</p>
      {d.open !== undefined && (
        <>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Ouv.</span>
            <span className="font-mono">{d.open?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Haut</span>
            <span className="font-mono text-green-500">
              {d.high?.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Bas</span>
            <span className="font-mono text-red-500">{d.low?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Clôt.</span>
            <span className="font-mono font-bold">{d.close?.toFixed(2)}</span>
          </div>
        </>
      )}
      {d.close !== undefined && d.open === undefined && (
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Clôture</span>
          <span className="font-mono font-bold">{d.close?.toFixed(2)}</span>
        </div>
      )}
      {d.ma50 !== null && d.ma50 !== undefined && (
        <div className="flex justify-between gap-4">
          <span className="text-orange-400">MA50</span>
          <span className="font-mono">{d.ma50?.toFixed(2)}</span>
        </div>
      )}
      {d.ma200 !== null && d.ma200 !== undefined && (
        <div className="flex justify-between gap-4">
          <span className="text-purple-400">MA200</span>
          <span className="font-mono">{d.ma200?.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
};

// Custom candlestick bar using SVG rectangles
const CandleBar = (props: any) => {
  const { x, y, width, height, payload } = props;
  if (!payload || height === 0) return null;
  const isUp = payload.isUp;
  const fill = isUp ? "#22c55e" : "#ef4444";
  const stroke = isUp ? "#16a34a" : "#dc2626";
  return (
    <rect
      x={x}
      y={y}
      width={Math.max(1, width)}
      height={Math.max(1, height)}
      fill={fill}
      stroke={stroke}
      strokeWidth={1}
    />
  );
};

export function CompanyChart({
  data,
  mode,
  showMA50,
  showMA200,
  horizontalLines,
  transactions,
}: CompanyChartProps) {
  const chartData = useMemo(() => {
    const ma50arr = showMA50 ? calculateMAArray(data, 50) : [];
    const ma200arr = showMA200 ? calculateMAArray(data, 200) : [];

    return data.map((row, i) => ({
      date: row.date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      }),
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      isUp: row.close >= row.open,
      ma50: showMA50 ? (ma50arr[i] ?? null) : null,
      ma200: showMA200 ? (ma200arr[i] ?? null) : null,
      // For bar chart: range is [open, close]
      bodyRange: [Math.min(row.open, row.close), Math.max(row.open, row.close)],
    }));
  }, [data, showMA50, showMA200]);

  const yDomain = useMemo(() => {
    if (!data.length) return ["auto", "auto"] as ["auto", "auto"];
    const allValues = data.flatMap((d) => [d.low, d.high]);
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const pad = (max - min) * 0.05;
    return [min - pad, max + pad] as [number, number];
  }, [data]);

  const transactionDates = useMemo(() => {
    return transactions.map((tx) => ({
      date: new Date(tx.date).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      }),
      type: tx.type,
      id: tx.id,
    }));
  }, [transactions]);

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-80 items-center justify-center">
          <p className="text-muted-foreground text-sm">
            Aucune donnée à afficher
          </p>
        </CardContent>
      </Card>
    );
  }

  const tickInterval = Math.max(1, Math.floor(chartData.length / 8));
  const barSize = Math.max(1, Math.min(8, 600 / chartData.length));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Graphique</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={420}>
          <ComposedChart
            data={chartData}
            margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="oklch(var(--border))"
              opacity={0.5}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "oklch(var(--muted-foreground))", fontSize: 11 }}
              tickLine={false}
              interval={tickInterval}
            />
            <YAxis
              domain={yDomain}
              tick={{ fill: "oklch(var(--muted-foreground))", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v.toFixed(0)}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />

            {horizontalLines.map((line) => (
              <ReferenceLine
                key={line.id}
                y={line.price}
                stroke={line.color}
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={{
                  value: line.label,
                  fill: line.color,
                  fontSize: 11,
                  position: "insideTopRight",
                }}
              />
            ))}

            {transactionDates.map((tx) => (
              <ReferenceLine
                key={tx.id}
                x={tx.date}
                stroke={tx.type === "BUY" ? "#22c55e" : "#ef4444"}
                strokeWidth={1.5}
                strokeDasharray="2 2"
                label={{
                  value: tx.type === "BUY" ? "▲" : "▼",
                  fill: tx.type === "BUY" ? "#22c55e" : "#ef4444",
                  fontSize: 10,
                }}
              />
            ))}

            {mode === "line" ? (
              <Line
                type="monotone"
                dataKey="close"
                stroke="oklch(var(--primary))"
                strokeWidth={2}
                dot={false}
                name="Prix"
                connectNulls
              />
            ) : (
              <Bar
                dataKey="bodyRange"
                name="OHLC"
                barSize={barSize}
                shape={<CandleBar />}
              />
            )}

            {showMA50 && (
              <Line
                type="monotone"
                dataKey="ma50"
                stroke="#f97316"
                strokeWidth={1.5}
                dot={false}
                name="MA50"
                connectNulls
              />
            )}
            {showMA200 && (
              <Line
                type="monotone"
                dataKey="ma200"
                stroke="#a855f7"
                strokeWidth={1.5}
                dot={false}
                name="MA200"
                connectNulls
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
