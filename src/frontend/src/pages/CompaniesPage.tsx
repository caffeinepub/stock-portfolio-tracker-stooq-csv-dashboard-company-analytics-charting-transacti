import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, List, Search, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { CompanyList } from "../components/companies/CompanyList";
import { useFavorites } from "../hooks/useFavorites";
import { useTickerMapping } from "../hooks/useTickerMapping";

export function CompaniesPage() {
  const navigate = useNavigate();
  const [companies] = useTickerMapping();
  const { favorites } = useFavorites();
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "favorites" | string>(
    "all",
  );

  const allSectors = useMemo(() => {
    const s = new Set(companies.map((c) => c.sector));
    return Array.from(s).sort();
  }, [companies]);

  const filteredCompanies = useMemo(() => {
    let result = companies;

    if (filterMode === "favorites") {
      result = result.filter((c) => favorites.includes(c.ticker));
    } else if (filterMode !== "all") {
      result = result.filter((c) => c.sector === filterMode);
    }

    if (search) {
      const query = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.companyName.toLowerCase().includes(query) ||
          c.ticker.toLowerCase().includes(query) ||
          c.sector.toLowerCase().includes(query),
      );
    }

    return [...result].sort((a, b) =>
      a.companyName.localeCompare(b.companyName),
    );
  }, [companies, favorites, search, filterMode]);

  const handleSelectCompany = (ticker: string) => {
    navigate({ to: "/company/$ticker", params: { ticker } });
  };

  const filterLabel =
    filterMode === "all"
      ? "Toutes"
      : filterMode === "favorites"
        ? "Favoris"
        : filterMode;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Entreprises</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {companies.length} entreprises · Données historiques via Stooq
        </p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher nom, ticker, secteur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-ocid="companies.search_input"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 shrink-0"
              data-ocid="companies.select"
            >
              {filterMode === "favorites" ? (
                <Star className="h-4 w-4" />
              ) : (
                <List className="h-4 w-4" />
              )}
              {filterLabel}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 max-h-80 overflow-y-auto"
          >
            <DropdownMenuItem onClick={() => setFilterMode("all")}>
              Toutes les entreprises
              {filterMode === "all" && (
                <Badge className="ml-auto text-xs" variant="secondary">
                  {companies.length}
                </Badge>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterMode("favorites")}>
              <Star className="mr-2 h-4 w-4" />
              Favoris
              {filterMode === "favorites" && (
                <Badge className="ml-auto text-xs" variant="secondary">
                  {favorites.length}
                </Badge>
              )}
            </DropdownMenuItem>
            <div className="my-1 h-px bg-border" />
            {allSectors.map((sector) => (
              <DropdownMenuItem
                key={sector}
                onClick={() => setFilterMode(sector)}
              >
                {sector}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredCompanies.length} résultat
          {filteredCompanies.length !== 1 ? "s" : ""}
        </p>
        {filterMode !== "all" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterMode("all")}
            className="text-xs h-7"
          >
            Réinitialiser
          </Button>
        )}
      </div>

      <CompanyList
        companies={filteredCompanies}
        onSelectCompany={handleSelectCompany}
      />
    </div>
  );
}
