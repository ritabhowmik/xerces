import { blackScholes, type BsResult } from "./blackScholes";
import type { Leg, MarketState } from "./types";

const CONTRACT_MULTIPLIER = 100; // 1 option contract or 1 "board lot" of stock = 100 shares

function signedQty(leg: Leg): number {
  return leg.side === "long" ? leg.quantity : -leg.quantity;
}

/** Per-share price + greeks for a single leg at a given market state. */
export function legUnit(leg: Leg, state: MarketState): BsResult {
  if (leg.kind === "stock") {
    return { price: state.spot, delta: 1, gamma: 0, theta: 0, vega: 0 };
  }
  return blackScholes(leg.kind, {
    spot: state.spot,
    strike: leg.strike,
    timeYears: state.daysToExpiry / 365,
    volatility: state.volatility,
    rate: state.rate,
  });
}

/** Net $ value of the whole position (positive = you'd receive this much if unwound now). */
export function positionValue(legs: Leg[], state: MarketState): number {
  return legs.reduce((sum, leg) => {
    const unit = legUnit(leg, state);
    return sum + signedQty(leg) * CONTRACT_MULTIPLIER * unit.price;
  }, 0);
}

export interface AggregateGreeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

export function positionGreeks(legs: Leg[], state: MarketState): AggregateGreeks {
  return legs.reduce<AggregateGreeks>(
    (acc, leg) => {
      const unit = legUnit(leg, state);
      const q = signedQty(leg) * CONTRACT_MULTIPLIER;
      acc.delta += q * unit.delta;
      acc.gamma += q * unit.gamma;
      acc.theta += q * unit.theta;
      acc.vega += q * unit.vega;
      return acc;
    },
    { delta: 0, gamma: 0, theta: 0, vega: 0 }
  );
}

/** Net premium paid (positive) or received (negative credit) to open the position. */
export function netEntryCost(legs: Leg[], entryState: MarketState): number {
  return positionValue(legs, entryState);
}

export interface PayoffPoint {
  spot: number;
  atExpiry: number;
  today: number;
}

/**
 * Sweeps a range of hypothetical stock prices and returns P&L at expiry
 * (pure intrinsic payoff) and P&L "today" (mark-to-market at the current
 * slider's vol/time), both net of the locked-in entry cost.
 */
export function buildPayoffSeries(
  legs: Leg[],
  entryState: MarketState,
  currentState: MarketState,
  opts: { min: number; max: number; steps?: number }
): PayoffPoint[] {
  const cost = netEntryCost(legs, entryState);
  const steps = opts.steps ?? 120;
  const points: PayoffPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const spot = opts.min + ((opts.max - opts.min) * i) / steps;
    const atExpiryState: MarketState = { ...currentState, spot, daysToExpiry: 0 };
    const todayState: MarketState = { ...currentState, spot };
    const atExpiry = positionValue(legs, atExpiryState) - cost;
    const today = positionValue(legs, todayState) - cost;
    points.push({ spot, atExpiry, today });
  }
  return points;
}
