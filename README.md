# xerces

- Options Payoff & Greeks Studio
- an interactive tool for seeing what happens to an options position as the market moves.
- pick a strategy, drag the stock price, implied volatility
- watch the payoff diagram and the position's Delta / Gamma / Theta / Vega update live.

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

- All pricing and Greeks are computed client-side with the Black-Scholes-Merton
model (`src/lib/blackScholes.ts`); there's no options-chain dependency, so IV
is a slider input rather than a scraped number — that's intentional, since
the point of the tool is to explore sensitivity to IV, not just display it.

## Stack

- Next.js (App Router) + TypeScript, deployed as a single app — the `/api/quote`
  route doubles as the "backend" (keeps any market-data API key server-side).
- Tailwind CSS for styling.
- Recharts for the payoff chart.
