import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQueries } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, Star, TrendingDown } from "lucide-react";
import { useState } from "react";
import { createActor } from "../backend";
import { useFavorites } from "../hooks/useFavorites";
import { useTickerMapping } from "../hooks/useTickerMapping";
import { calculateStatistics } from "../lib/analytics";
import type { OHLCRow } from "../lib/types";
import { fetchStooqHistory } from "../lib/yahooFinance";

const DIP_THRESHOLD = 10;

function formatPrice(val: number | null, decimals = 2): string {
  if (val === null) return "\u2014";
  return val.toFixed(decimals);
}

function formatVolume(val: number | null | undefined): string {
  if (val == null) return "\u2014";
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
  return String(val);
}

function formatChange(val: number | null): string {
  if (val === null) return "\u2014";
  return `${val >= 0 ? "+" : ""}${val.toFixed(2)}%`;
}

export function OpportunitiesPage() {
  const navigate = useNavigate();
  const [companies] = useTickerMapping();
  const { favorites } = useFavorites();
  const [favoritesOnly, setFavoritesOnly] = useState(true);
  const { actor, isFetching: actorLoading } = useActor(createActor);

  const companiesToFetch = favoritesOnly
    ? companies.filter((c) => favorites.includes(c.ticker))
    : companies;

  const results = useQueries({
    queries: companiesToFetch.map((company) => ({
      // Use consistent "stock-history" key to share cache with CompanyDetailPage
      queryKey: ["stock-history", company.ticker],
      queryFn: async () => {
        if (!actor) return null;
        const result = await fetchStooqHistory(actor, company.ticker);
        if ("type" in result) throw new Error(result.message);
        return result;
      },
      enabled: !!actor && !actorLoading,
      staleTime: 15 * 60 * 1000,
      retry: 1,
    })),
  });

  const rows = companiesToFetch.map((company, i) => {
    const result = results[i];
    const ts = result?.data;
    const stats = ts ? calculateStatistics(ts.data as OHLCRow[]) : null;
    const lastRow =
      ts && ts.data.length > 0 ? ts.data[ts.data.length - 1] : null;
    const volume = (lastRow as any)?.volume ?? null;
    const distanceFromLow =
      stats?.latestClose != null && stats?.low52W != null && stats.low52W > 0
        ? ((stats.latestClose - stats.low52W) / stats.low52W) * 100
        : null;

    return {
      company,
      isLoading: result?.isLoading,
      isError: result?.isError,
      latestClose: stats?.latestClose ?? null,
      low52W: stats?.low52W ?? null,
      high52W: stats?.high52W ?? null,
      volume,
      change1M: stats?.change1M ?? null,
      distanceFromLow,
    };
  });

  const sorted = [...rows].sort((a, b) => {
    if (a.distanceFromLow === null && b.distanceFromLow === null) return 0;
    if (a.distanceFromLow === null) return 1;
    if (b.distanceFromLow === null) return -1;
    return a.distanceFromLow - b.distanceFromLow;
  });

  const dipCount = sorted.filter(
    (r) => r.distanceFromLow !== null && r.distanceFromLow <= DIP_THRESHOLD,
  ).length;

  const allLoaded = results.every((r) => !r.isLoading);
  const loadingCount = results.filter((r) => r.isLoading).length;

  const isEmpty = favoritesOnly && favorites.length === 0;

  return (
    <div className="flex flex-col gap-6" data-ocid="opportunities.page">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10">
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold font-display text-foreground">
              Opportunités
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-12">
            Entreprises proches de leur plus bas sur 52 semaines — seuil ≤
            {DIP_THRESHOLD}%
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Label
            htmlFor="favorites-toggle"
            className="text-sm text-muted-foreground"
          >
            Favoris uniquement
          </Label>
          <Switch
            id="favorites-toggle"
            checked={favoritesOnly}
            onCheckedChange={setFavoritesOnly}
            data-ocid="opportunities.favorites.toggle"
          />
        </div>
      </div>

      {/* Stats bar */}
      {!isEmpty && companiesToFetch.length > 0 && (
        <div className="flex items-center gap-4 flex-wrap">
          {!allLoaded && (
            <div
              className="flex items-center gap-2 text-sm text-muted-foreground"
              data-ocid="opportunities.loading_state"
            >
              <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
              Chargement ({loadingCount} restant{loadingCount > 1 ? "s" : ""})
            </div>
          )}
          {allLoaded && dipCount > 0 && (
            <Badge variant="destructive" className="gap-1.5">
              <TrendingDown className="h-3 w-3" />
              {dipCount} entreprise{dipCount > 1 ? "s" : ""} en zone de dip
            </Badge>
          )}
          {allLoaded && dipCount === 0 && (
            <span className="text-sm text-muted-foreground">
              Aucune entreprise à ≤{DIP_THRESHOLD}% du plus bas 52 semaines
            </span>
          )}
        </div>
      )}

      {/* Empty state: no favorites */}
      {isEmpty && (
        <div
          className="flex flex-col items-center justify-center gap-4 py-20 text-center"
          data-ocid="opportunities.empty_state"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Star className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">
              Aucun favori enregistré
            </p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Ajoutez des entreprises à vos favoris depuis la liste, ou
              désactivez le filtre pour voir toutes les entreprises.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFavoritesOnly(false)}
          >
            Afficher toutes les entreprises
          </Button>
        </div>
      )}

      {/* Table */}
      {!isEmpty && (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-8 text-center">#</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead className="hidden sm:table-cell">Ticker</TableHead>
                <TableHead className="text-right">Prix actuel</TableHead>
                <TableHead className="text-right">Plus bas 52S</TableHead>
                <TableHead className="text-right font-medium text-destructive">
                  % au-dessus
                </TableHead>
                <TableHead className="hidden md:table-cell text-right">
                  Volume
                </TableHead>
                <TableHead className="hidden lg:table-cell text-right">
                  Var. 1M
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((row, idx) => {
                const isDip =
                  row.distanceFromLow !== null &&
                  row.distanceFromLow <= DIP_THRESHOLD;
                const ocidIndex = idx + 1;

                return (
                  <TableRow
                    key={row.company.ticker}
                    className={`cursor-pointer transition-colors ${
                      isDip
                        ? "bg-destructive/5 hover:bg-destructive/10"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() =>
                      navigate({
                        to: "/company/$ticker",
                        params: { ticker: row.company.ticker },
                      })
                    }
                    data-ocid={`opportunities.item.${ocidIndex}`}
                  >
                    <TableCell className="text-center text-xs text-muted-foreground w-8">
                      {ocidIndex}
                    </TableCell>

                    <TableCell>
                      {row.isLoading ? (
                        <Skeleton className="h-4 w-32" />
                      ) : (
                        <div className="flex items-center gap-2">
                          {row.isError && (
                            <AlertCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          )}
                          <span className="font-medium text-sm">
                            {row.company.companyName}
                          </span>
                          {isDip && (
                            <Badge
                              variant="destructive"
                              className="text-[10px] px-1.5 py-0 h-4 shrink-0"
                            >
                              DIP
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="hidden sm:table-cell">
                      <span className="font-mono text-xs text-muted-foreground">
                        {row.company.ticker}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      {row.isLoading ? (
                        <Skeleton className="h-4 w-16 ml-auto" />
                      ) : (
                        <span className="font-mono text-sm">
                          {formatPrice(row.latestClose)}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      {row.isLoading ? (
                        <Skeleton className="h-4 w-16 ml-auto" />
                      ) : (
                        <span className="font-mono text-sm text-muted-foreground">
                          {formatPrice(row.low52W)}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      {row.isLoading ? (
                        <Skeleton className="h-4 w-14 ml-auto" />
                      ) : row.distanceFromLow !== null ? (
                        <span
                          className={`font-mono text-sm font-semibold ${
                            isDip ? "text-destructive" : "text-foreground"
                          }`}
                        >
                          +{row.distanceFromLow.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>

                    <TableCell className="hidden md:table-cell text-right">
                      {row.isLoading ? (
                        <Skeleton className="h-4 w-14 ml-auto" />
                      ) : (
                        <span className="font-mono text-xs text-muted-foreground">
                          {formatVolume(row.volume)}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="hidden lg:table-cell text-right">
                      {row.isLoading ? (
                        <Skeleton className="h-4 w-14 ml-auto" />
                      ) : (
                        <span
                          className={`font-mono text-sm ${
                            row.change1M === null
                              ? "text-muted-foreground"
                              : row.change1M >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-500 dark:text-red-400"
                          }`}
                        >
                          {formatChange(row.change1M)}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}

              {companiesToFetch.length === 0 && !isEmpty && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-12 text-muted-foreground text-sm"
                    data-ocid="opportunities.empty_state"
                  >
                    Aucune entreprise à afficher.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Footer note */}
      {!isEmpty && (
        <p className="text-xs text-muted-foreground text-center">
          Seuil affiché : ≤{DIP_THRESHOLD}% du plus bas 52 semaines · Données
          différées ~15 min · Cliquez sur une ligne pour ouvrir la fiche
          entreprise
        </p>
      )}
    </div>
  );
}
