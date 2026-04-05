# Stock Portfolio Tracker

## Current State

The app is a full-stack French-language stock portfolio dashboard with:
- 100 major companies tracked via `companyUniverse.ts`
- All data fetching in `yahooFinance.ts` (named `fetchStooqHistory` but using Yahoo Finance + Stooq fallback)
- `stooq.ts` kept for `filterByTimeRange` utility and Stooq fallback
- Data fetched via `useStooqHistory` hook (key: `stock-history`)
- `OpportunitiesPage`, `usePortfolio`, and `CompanyDetailPage` all use `fetchStooqHistory` from `yahooFinance.ts`
- Yahoo Finance direct fetch fails for most tickers due to CORS/session cookie blocking
- CORS proxies (corsproxy.io, allorigins.win, codetabs.com, thingproxy) are unreliable (403, 400, timeouts)

## Requested Changes (Diff)

### Add
- New `fmpFinance.ts` module that fetches data from Financial Modeling Prep (FMP) API using the public `demo` key
  - Endpoint: `https://financialmodelingprep.com/api/v3/historical-price-full/{symbol}?apikey=demo`
  - This is CORS-compatible and requires no signup
  - Parse FMP JSON response into `TimeSeries` / `OHLCRow[]`
  - FMP ticker format: mostly same as US tickers (AAPL, MSFT, etc.), EU tickers may need mapping (e.g. LVMH.PA → MC.PA or similar)

### Modify
- `yahooFinance.ts`: Rename/refactor `fetchStooqHistory` to use FMP as **primary source**, then Yahoo Finance direct as fallback, then Stooq via proxy as last resort
  - Keep function name `fetchStooqHistory` to avoid changing all callers
  - Implement proper ticker mapping for FMP (EU tickers)
  - Add robust error handling: if FMP fails, try Yahoo direct, then Stooq proxy
- Ticker mappings in `companyUniverse.ts` or a dedicated mapping file: ensure FMP-compatible tickers for all 100 companies
- Footer note in `OpportunitiesPage`: update to mention FMP as data source

### Remove
- Remove the excessive parallel Yahoo Finance strategies (crumb, CSV v7, multiple proxies in parallel) that caused rate limiting and complexity
- Simplify to: FMP first (reliable, CORS-compatible) → Yahoo direct fallback → Stooq proxy last resort

## Implementation Plan

1. Create `src/frontend/src/lib/fmpFinance.ts`:
   - Fetch from `https://financialmodelingprep.com/api/v3/historical-price-full/{SYMBOL}?apikey=demo`
   - Parse JSON: `response.historical[]` with fields `date`, `open`, `high`, `low`, `close`, `volume`
   - Return `TimeSeries | StooqError`
   - Add FMP ticker mapping for European tickers (e.g. LVMH.PA, MC.PA format)
   - 15-second timeout

2. Rewrite `src/frontend/src/lib/yahooFinance.ts`:
   - `fetchStooqHistory(ticker)`: try FMP first → Yahoo Finance direct → Stooq via corsproxy.io
   - Sequential (not parallel) to avoid rate limiting
   - Keep `filterByTimeRange` utility or import from `stooq.ts`
   - Map tickers to FMP format before calling FMP

3. Keep all other files unchanged (hooks, pages, components)

4. Validate and deploy
