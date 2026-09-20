# xerces

Options Payoff & Greeks Studio — an interactive tool for seeing what happens
to an options position as the market moves. Pick a strategy, then drag the
stock price, implied volatility, and days-to-expiry to watch the payoff
diagram and the position's Delta / Gamma / Theta / Vega update live.

## What it does

- **Payoff diagram** — profit/loss vs. stock price at expiry, plus a second
  curve showing today's mark-to-market value (so you can see time decay and
  vol effects distinct from the terminal payoff).
- **Live Greeks** — aggregated across every leg in the position, recomputed
  on every slider move.
- **Strategies** — long/short call, long/short put, bull call spread, bear
  put spread, and a collar. Strikes are editable per leg.
- **Live spot price** — type a ticker and fetch its current price via
  `/api/quote`; falls back to a deterministic mock price if no market-data
  key is configured, so the app works with zero setup.

All pricing and Greeks are computed client-side with the Black-Scholes-Merton
model (`src/lib/blackScholes.ts`); there's no options-chain dependency, so IV
is a slider input rather than a scraped number — that's intentional, since
the point of the tool is to explore sensitivity to IV, not just display it.

## Stack

- Next.js (App Router) + TypeScript, deployed as a single app — the `/api/quote`
  route doubles as the "backend" (keeps any market-data API key server-side).
- Tailwind CSS for styling.
- Recharts for the payoff chart.

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Live quotes (optional)

By default `/api/quote` returns a deterministic mock price per symbol, so
the app is fully usable without any configuration. To pull real quotes:

1. Get a free API key at https://finnhub.io/register.
2. Copy `.env.example` to `.env.local` and set `FINNHUB_API_KEY`.
3. Restart the dev server.

## Deploying

This is a stock Next.js app, so it deploys anywhere Next.js does:

- **Vercel** (recommended) — zero-config; `vercel.com/new`, import this repo,
  add `FINNHUB_API_KEY` as an environment variable if you want live quotes.
  The `/api/quote` route runs as a serverless function automatically.
- **Render / Railway** — if you'd rather run a persistent Node process (e.g.
  once this grows a database for saved/shared strategies), both support a
  one-click deploy from a GitHub repo with `npm run build` / `npm start`.
- **Netlify** — also supports Next.js API routes via their adapter, same
  zero-config flow as Vercel.

No database, queue, or third-party infra is required for the current feature
set — the only external dependency is the optional quote API.
