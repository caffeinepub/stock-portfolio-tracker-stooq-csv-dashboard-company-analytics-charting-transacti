import { Badge } from "@/components/ui/badge";
import { ChevronRight, Star } from "lucide-react";
import type { Company } from "../../data/companyUniverse";
import { useFavorites } from "../../hooks/useFavorites";

interface CompanyListProps {
  companies: Company[];
  onSelectCompany: (ticker: string) => void;
}

export function CompanyList({ companies, onSelectCompany }: CompanyListProps) {
  const { isFavorite, toggleFavorite } = useFavorites();

  if (companies.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-center"
        data-ocid="companies.empty_state"
      >
        <svg
          className="mb-4 h-12 w-12 text-muted-foreground/30"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
          aria-label="Aucune entreprise"
          role="img"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
        <p className="text-sm font-medium text-muted-foreground">
          Aucune entreprise trouvée
        </p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Modifiez votre recherche ou filtre
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
      {companies.map((company, index) => (
        <div
          key={company.ticker}
          className="group relative flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
          data-ocid={`companies.item.${index + 1}`}
        >
          {/* Clickable overlay for row (excluding the favorite button) */}
          <button
            type="button"
            className="absolute inset-0 w-full h-full cursor-pointer"
            onClick={() => onSelectCompany(company.ticker)}
            aria-label={`Voir ${company.companyName}`}
          />
          <span className="relative z-10 text-xl shrink-0 w-7 text-center pointer-events-none">
            {company.country}
          </span>
          <div className="relative z-10 flex-1 min-w-0 pointer-events-none">
            <span className="font-semibold text-sm truncate text-foreground group-hover:text-primary transition-colors block">
              {company.companyName}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-wide">
                {company.ticker}
              </span>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-xs text-muted-foreground">
                {company.market}
              </span>
            </div>
          </div>
          <Badge
            variant="outline"
            className="relative z-10 text-xs hidden sm:flex shrink-0 pointer-events-none"
          >
            {company.sector}
          </Badge>
          <button
            type="button"
            className="relative z-10 p-1.5 rounded-md hover:bg-accent shrink-0 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(company.ticker);
            }}
            data-ocid={`companies.toggle.${index + 1}`}
            aria-label={
              isFavorite(company.ticker)
                ? "Retirer des favoris"
                : "Ajouter aux favoris"
            }
          >
            <Star
              className={`h-4 w-4 transition-colors ${isFavorite(company.ticker) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`}
            />
          </button>
          <ChevronRight className="relative z-10 h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0 pointer-events-none" />
        </div>
      ))}
    </div>
  );
}
