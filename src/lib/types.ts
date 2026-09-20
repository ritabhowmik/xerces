import type { OptionType } from "./blackScholes";

export type LegKind = OptionType | "stock";
export type Side = "long" | "short";

export interface Leg {
  id: string;
  kind: LegKind;
  side: Side;
  strike: number; // ignored for stock legs
  quantity: number; // contracts (1 contract = 100 shares); stock legs = shares/100
}

export interface StrategyDefinition {
  id: string;
  name: string;
  description: string;
  // Given a spot price to seed strikes around and a strike spacing, produce
  // the default legs for this strategy.
  buildLegs: (spot: number, spacing: number) => Omit<Leg, "id">[];
}

export interface MarketState {
  spot: number;
  volatility: number; // decimal, e.g. 0.3
  daysToExpiry: number;
  rate: number; // decimal, e.g. 0.045
}
