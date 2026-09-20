"use client";

import { useEffect, useMemo, useState } from "react";
import { SliderRow } from "@/components/Controls";
import PayoffChart from "@/components/PayoffChart";
import GreeksPanel from "@/components/GreeksPanel";
import { STRATEGIES, getStrategy } from "@/lib/strategies";
import { buildPayoffSeries, positionGreeks } from "@/lib/position";
import type { Leg, MarketState } from "@/lib/types";

const DEFAULT_DTE = 30;
const DEFAULT_VOL = 0.3;
const DEFAULT_RATE = 0.045;

function makeLegs(strategyId: string, spot: number): Leg[] {
  const strategy = getStrategy(strategyId);
  const spacing = Math.max(1, Math.round(spot * 0.05));
  return strategy.buildLegs(spot, spacing).map((leg, i) => ({ ...leg, id: `${strategyId}-${i}` }));
}

export default function Home() {
  const [symbol, setSymbol] = useState("AAPL");
  const [symbolInput, setSymbolInput] = useState("AAPL");
  const [quoteSource, setQuoteSource] = useState<string | null>(null);
  const [quoteNote, setQuoteNote] = useState<string | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);

  const [strategyId, setStrategyId] = useState(STRATEGIES[0].id);
  const [legs, setLegs] = useState<Leg[]>(() => makeLegs(STRATEGIES[0].id, 100));

  const [current, setCurrent] = useState<MarketState>({
    spot: 100,
    volatility: DEFAULT_VOL,
    daysToExpiry: DEFAULT_DTE,
    rate: DEFAULT_RATE,
  });
  const [entry, setEntry] = useState<MarketState>(current);

  const fetchQuote = async (sym: string) => {
    setLoadingQuote(true);
    try {
      const res = await fetch(`/api/quote?symbol=${encodeURIComponent(sym)}`);
      const data = await res.json();
      if (typeof data.price === "number") {
        const nextState: MarketState = { ...current, spot: data.price };
        const newLegs = makeLegs(strategyId, data.price);
        setCurrent(nextState);
        setEntry(nextState);
        setLegs(newLegs);
        setQuoteSource(data.source ?? null);
        setQuoteNote(null);
      }
    } catch {
      setQuoteNote("Could not reach the quote API — using the last known price.");
    } finally {
      setLoadingQuote(false);
    }
  };

  useEffect(() => {
    // Defer to a microtask so the initial fetch's setState calls happen
    // outside the effect's synchronous body.
    queueMicrotask(() => {
      fetchQuote(symbol);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStrategyChange = (id: string) => {
    setStrategyId(id);
    const newLegs = makeLegs(id, current.spot);
    setLegs(newLegs);
    setEntry(current); // lock in cost basis at today's market for the new structure
  };

  const relockCostBasis = () => setEntry(current);

  const updateLegStrike = (id: string, strike: number) => {
    setLegs((prev) => prev.map((l) => (l.id === id ? { ...l, strike } : l)));
  };

  const payoffData = useMemo(() => {
    const spread = Math.max(current.spot * 0.6, 20);
    return buildPayoffSeries(legs, entry, current, {
      min: Math.max(0.01, current.spot - spread),
      max: current.spot + spread,
    });
  }, [legs, entry, current]);

  const greeks = useMemo(() => positionGreeks(legs, current), [legs, current]);

  const breakevens = useMemo(() => {
    const bes: number[] = [];
    for (let i = 1; i < payoffData.length; i++) {
      const a = payoffData[i - 1].atExpiry;
      const b = payoffData[i].atExpiry;
      if ((a < 0 && b >= 0) || (a > 0 && b <= 0)) {
        const t = a === b ? 0 : -a / (b - a);
        bes.push(payoffData[i - 1].spot + t * (payoffData[i].spot - payoffData[i - 1].spot));
      }
    }
    return bes;
  }, [payoffData]);

  const strategy = getStrategy(strategyId);

  return (
    <main className="mx-auto max-w-2xl px-6 py-20 sm:py-28">
      <header className="mb-16">
        <h1 className="text-lg font-medium tracking-tight text-neutral-900 dark:text-neutral-50">
          xerces
        </h1>
        <p className="mt-2 text-sm text-neutral-400 dark:text-neutral-500">
          Options payoff &amp; Greeks studio — move price, volatility, and time to see how a position responds.
        </p>
      </header>

      <section className="mb-14 flex flex-wrap items-end gap-x-10 gap-y-6">
        <div>
          <label className="mb-2 block text-xs uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Symbol
          </label>
          <div className="flex items-baseline gap-3">
            <input
              value={symbolInput}
              onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSymbol(symbolInput);
                  fetchQuote(symbolInput);
                }
              }}
              className="w-20 border-0 border-b border-neutral-200 bg-transparent pb-1 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-800 dark:text-neutral-100"
              maxLength={10}
            />
            <button
              onClick={() => {
                setSymbol(symbolInput);
                fetchQuote(symbolInput);
              }}
              disabled={loadingQuote}
              className="text-sm text-neutral-500 underline decoration-neutral-300 underline-offset-4 hover:text-neutral-900 disabled:opacity-50 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              {loadingQuote ? "fetching…" : "fetch price"}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Strategy
          </label>
          <select
            value={strategyId}
            onChange={(e) => handleStrategyChange(e.target.value)}
            className="border-0 border-b border-neutral-200 bg-transparent pb-1 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-800 dark:text-neutral-100"
          >
            {STRATEGIES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={relockCostBasis}
          className="text-sm text-neutral-400 underline decoration-neutral-200 underline-offset-4 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-200"
        >
          re-price at current market
        </button>
      </section>

      <p className="mb-3 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">{strategy.description}</p>
      {(quoteNote || quoteSource === "mock") && (
        <p className="mb-14 text-xs text-neutral-400 dark:text-neutral-600">
          {quoteNote ?? "Showing a mock price — set FINNHUB_API_KEY for live quotes."}
        </p>
      )}
      {!quoteNote && quoteSource !== "mock" && <div className="mb-14" />}

      <section className="mb-16">
        <h2 className="mb-5 text-xs uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Legs</h2>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
          {legs.map((leg) => (
            <div key={leg.id} className="flex items-center justify-between py-3 text-sm">
              <span className="capitalize text-neutral-700 dark:text-neutral-300">
                {leg.side} {leg.quantity}× {leg.kind}
              </span>
              {leg.kind !== "stock" ? (
                <label className="flex items-center gap-2 text-neutral-400 dark:text-neutral-500">
                  strike
                  <input
                    type="number"
                    value={leg.strike}
                    step="0.5"
                    onChange={(e) => updateLegStrike(leg.id, Number(e.target.value))}
                    className="w-20 border-0 border-b border-neutral-200 bg-transparent py-0.5 text-right tabular-nums text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-800 dark:text-neutral-100"
                  />
                </label>
              ) : (
                <span className="text-neutral-400 dark:text-neutral-600">100 sh</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16 grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2">
        <SliderRow
          label="Stock price"
          value={current.spot}
          min={Math.max(1, current.spot * 0.3)}
          max={current.spot * 2}
          step={0.5}
          onChange={(v) => setCurrent((s) => ({ ...s, spot: v }))}
          format={(v) => `$${v.toFixed(2)}`}
        />
        <SliderRow
          label="Implied volatility"
          value={current.volatility}
          min={0.05}
          max={1.5}
          step={0.01}
          onChange={(v) => setCurrent((s) => ({ ...s, volatility: v }))}
          format={(v) => `${(v * 100).toFixed(0)}%`}
        />
        <SliderRow
          label="Days to expiry"
          value={current.daysToExpiry}
          min={0}
          max={Math.max(entry.daysToExpiry, DEFAULT_DTE)}
          step={1}
          onChange={(v) => setCurrent((s) => ({ ...s, daysToExpiry: v }))}
          format={(v) => `${v} d`}
        />
        <SliderRow
          label="Risk-free rate"
          value={current.rate}
          min={0}
          max={0.1}
          step={0.001}
          onChange={(v) => setCurrent((s) => ({ ...s, rate: v }))}
          format={(v) => `${(v * 100).toFixed(1)}%`}
        />
      </section>

      <section className="mb-16">
        <GreeksPanel greeks={greeks} />
      </section>

      <section className="mb-16">
        <PayoffChart data={payoffData} currentSpot={current.spot} breakevens={breakevens} />
      </section>

      <footer className="text-xs text-neutral-300 dark:text-neutral-700">
        Educational tool. Prices are theoretical (Black-Scholes) and quotes may be delayed or simulated — not investment advice.
      </footer>
    </main>
  );
}
