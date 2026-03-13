# Stock Portfolio Tracker (Stooq CSV)

## Current State
Frontend shell exists with routing to Companies, CompanyDetail, Portfolio, Settings pages. No working backend, no real data fetching, no charts, no transactions logic.

## Requested Changes (Diff)

### Add
- HTTP outcall backend endpoint to proxy Stooq CSV requests (bypass CORS)
- Full list of 100 companies with confirmed Stooq tickers
- Companies page: search bar, favorites, alphabetical list
- Company detail page: stats panel (price, variations, 52w high/low, MA50/MA200, volatility, drawdown), interactive chart (line/candlestick, 1y/2y/3y/5y, MA overlays, zoom, tooltips), horizontal price lines (support/resistance/buy target/sell target/custom), transactions (BUY/SELL with date/qty/price/note), buy targets with status, BUY/SELL markers on chart
- Portfolio page: total value, global P&L, position breakdown, performance per stock
- Settings page: dark/light mode toggle, data preferences
- localStorage persistence for: transactions, horizontal lines, buy targets, favorites
- Dark/light mode toggle
- Sidebar navigation: Companies, Portfolio, Settings

### Modify
- App.tsx: fix routing (was incorrectly nesting RouterProvider)
- Rebuild all pages from scratch with full functionality

### Remove
- Broken stub components

## Implementation Plan

### 100 Companies List
US (.us): intc, amd, mu, nvda, qcom, txn, amat, lrcx, klac, meta, googl, amzn, nflx, pypl, sq, crm, orcl, ibm, tsla, gm, f, xom, cvx, cop, oxy, slb, hal, bkr, fcx, clf, ccj, ba, cat, de, ge, mmm, hon, cmi, zim, fro, eurn, mrna, gild, amgn, biib, vrtx, regn, ilmn, crsp, nvax, ea, ttwo, wbd, dis, dal, aal, ual, anet, csco, jnpr, vale, mrvl, wdc, baba, ntes, bidu, jd, se, shop, nxpi, nhydy, nem, gold, sblk, dac, bntx, ryaay, nsany, tm (82 .us)
Europe: stmpa.pa, air.pa, rno.pa, af.pa, tte.pa, mt.pa, ubi.pa, asml.as, stlam.as, ifx.de, vow3.de, bmw.de, mbg.de, sie.de, hlag.de, lha.de, abbn.sw, maersk-b.co, nokia.he, eric-b.st (20)
Canada: bhp.to, rio.to (2) — but vale moved to .us, so total = 82 + 20 = 102... trim to exactly 100 by removing 2 duplicates or borderline ones.

### Backend
- Single Motoko endpoint: `fetchStooqData(ticker: Text) : async Text` — performs HTTP GET to stooq.com CSV URL, returns raw CSV text
- Cache results with TTL to avoid repeated external calls

### Frontend
- `data/companies.ts`: full 100-company list with name, ticker, exchange, sector
- `hooks/useStooqData.ts`: fetches CSV from backend, parses OHLCV, caches in memory
- `hooks/useLocalStorage.ts`: generic localStorage hook
- `lib/calculations.ts`: price change %, MA50, MA200, volatility, drawdown, P&L
- `lib/csvParser.ts`: parse Stooq CSV format (Date, Open, High, Low, Close, Volume)
- `components/layout/DashboardLayout.tsx`: sidebar + main content
- `components/chart/StockChart.tsx`: Recharts-based line/candlestick chart with MA overlays, horizontal lines, transaction markers, zoom, tooltip
- `pages/CompaniesPage.tsx`: search, favorites filter, alphabetical company list
- `pages/CompanyDetailPage.tsx`: stats, chart, lines manager, transactions, buy targets
- `pages/PortfolioPage.tsx`: aggregated portfolio view
- `pages/SettingsPage.tsx`: theme toggle
