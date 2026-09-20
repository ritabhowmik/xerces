import type { StrategyDefinition } from "./types";

const round2 = (n: number) => Math.round(n * 100) / 100;

export const STRATEGIES: StrategyDefinition[] = [
  {
    id: "long-call",
    name: "Long Call",
    description: "Buy a call. Unlimited upside, loss capped at the premium paid.",
    buildLegs: (spot) => [
      { kind: "call", side: "long", strike: round2(spot), quantity: 1 },
    ],
  },
  {
    id: "long-put",
    name: "Long Put",
    description: "Buy a put. Profits as the stock falls, loss capped at the premium paid.",
    buildLegs: (spot) => [
      { kind: "put", side: "long", strike: round2(spot), quantity: 1 },
    ],
  },
  {
    id: "short-call",
    name: "Short Call (naked)",
    description: "Sell a call. Capped profit (premium), theoretically unlimited loss.",
    buildLegs: (spot) => [
      { kind: "call", side: "short", strike: round2(spot), quantity: 1 },
    ],
  },
  {
    id: "short-put",
    name: "Short Put (naked)",
    description: "Sell a put. Capped profit (premium), large loss if the stock craters.",
    buildLegs: (spot) => [
      { kind: "put", side: "short", strike: round2(spot), quantity: 1 },
    ],
  },
  {
    id: "bull-call-spread",
    name: "Bull Call Spread",
    description: "Buy a call, sell a higher-strike call. Caps both cost and upside.",
    buildLegs: (spot, spacing) => [
      { kind: "call", side: "long", strike: round2(spot), quantity: 1 },
      { kind: "call", side: "short", strike: round2(spot + spacing), quantity: 1 },
    ],
  },
  {
    id: "bear-put-spread",
    name: "Bear Put Spread",
    description: "Buy a put, sell a lower-strike put. Caps both cost and downside profit.",
    buildLegs: (spot, spacing) => [
      { kind: "put", side: "long", strike: round2(spot), quantity: 1 },
      { kind: "put", side: "short", strike: round2(spot - spacing), quantity: 1 },
    ],
  },
  {
    id: "collar",
    name: "Collar",
    description: "Own the stock, buy a protective put, sell a call to fund it. Boxes in the range.",
    buildLegs: (spot, spacing) => [
      { kind: "stock", side: "long", strike: 0, quantity: 1 },
      { kind: "put", side: "long", strike: round2(spot - spacing), quantity: 1 },
      { kind: "call", side: "short", strike: round2(spot + spacing), quantity: 1 },
    ],
  },
];

export function getStrategy(id: string): StrategyDefinition {
  const s = STRATEGIES.find((s) => s.id === id);
  if (!s) throw new Error(`Unknown strategy: ${id}`);
  return s;
}
