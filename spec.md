# Stock Portfolio Tracker

## Current State

The app fetches stock data via Stooq CSV format through CORS proxies (`api.allorigins.win`, `corsproxy.io`, `thingproxy.freeboard.io`). All data fetching is in `src/frontend/src/lib/stooq.ts`, used by `useStooqHistory` hook and `usePortfolio` hook. The proxies are failing with "Failed to fetch" errors, making all company detail pages unusable.

## Requested Changes (Diff)

### Add
- New `src/frontend/src/lib/yahooFinance.ts` module that:
  - Converts Stooq-style tickers to Yahoo Finance format: uppercase everything, drop `.US` suffix (e.g. `nvda.us` → `NVDA`, `asml.as` → `ASML.AS`, `stmpa.pa` → `STMPA.PA`)
  - Fetches from `https://query2.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=2y&includePrePost=false`
  - First tries direct fetch (Yahoo Finance v8 chart API supports CORS with `Access-Control-Allow-Origin: *`)
  - On CORS/network error, falls back to `https://corsproxy.io/?url=` + encoded URL
  - Second fallback: `https://api.allorigins.win/get?url=` + encoded URL (parses `.contents` field from the JSON wrapper)
  - Validates response is JSON (not HTML) before parsing
  - Parses Yahoo Finance chart JSON: `data.chart.result[0]` → timestamps + `indicators.quote[0]` (open/high/low/close/volume)
  - Returns same `TimeSeries | StooqError` type as current `stooq.ts`
  - Exports `fetchStockHistory` (aliased as `fetchStooqHistory` for backward compat) and `filterByTimeRange`
  - For `3Y` range: request `5y` from Yahoo and filter client-side
  - Timeout of 15 seconds per attempt

### Modify
- `src/frontend/src/lib/stooq.ts`: replace all content with re-exports from `yahooFinance.ts` so no other files need to change (or update all imports directly)
- `src/frontend/src/hooks/usePortfolio.ts`: if importing from `stooq`, update to use `fetchStockHistory`
- `src/frontend/src/pages/CompanyDetailPage.tsx`: already imports `filterByTimeRange` from `stooq` — ensure this still works

### Remove
- The CORS proxy cascade logic for Stooq CSV — replaced by Yahoo Finance approach
- The CSV parsing logic — replaced by Yahoo Finance JSON parsing

## Implementation Plan

1. Create `src/frontend/src/lib/yahooFinance.ts` with:
   - `stooqToYahoo(ticker: string): string` converter
   - `fetchYahooChart(yahooSymbol: string): Promise<any>` with 3-attempt strategy (direct, corsproxy.io, allorigins.win)
   - `parseYahooChart(data: any, stooqTicker: string): OHLCRow[]` parser
   - `fetchStooqHistory(ticker: string): Promise<TimeSeries | StooqError>` (main export, same signature as before)
   - `filterByTimeRange` (same as before, re-export)
   - All error messages in French
2. Replace `src/frontend/src/lib/stooq.ts` content entirely with imports/re-exports from `yahooFinance.ts` to maintain backward compatibility with all existing imports
3. Run validate
