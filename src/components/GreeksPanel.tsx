import type { AggregateGreeks } from "@/lib/position";

interface GreeksPanelProps {
  greeks: AggregateGreeks;
}

const cards: {
  key: keyof AggregateGreeks;
  label: string;
  blurb: string;
  format: (v: number) => string;
}[] = [
  {
    key: "delta",
    label: "Delta",
    blurb: "$ per $1 the stock moves",
    format: (v) => v.toFixed(2),
  },
  {
    key: "gamma",
    label: "Gamma",
    blurb: "how fast delta changes",
    format: (v) => v.toFixed(3),
  },
  {
    key: "theta",
    label: "Theta",
    blurb: "$ per day, all else equal",
    format: (v) => (v >= 0 ? "+" : "") + v.toFixed(2),
  },
  {
    key: "vega",
    label: "Vega",
    blurb: "$ per 1 vol point",
    format: (v) => v.toFixed(2),
  },
];

export default function GreeksPanel({ greeks }: GreeksPanelProps) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
      {cards.map((c) => {
        const value = greeks[c.key];
        const tone =
          c.key === "theta"
            ? value >= 0
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-red-700 dark:text-red-400"
            : "text-neutral-900 dark:text-neutral-100";
        return (
          <div key={c.key}>
            <div className="text-xs uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              {c.label}
            </div>
            <div className={`mt-1.5 text-2xl font-medium tabular-nums ${tone}`}>{c.format(value)}</div>
            <div className="mt-1 text-xs leading-snug text-neutral-400 dark:text-neutral-600">{c.blurb}</div>
          </div>
        );
      })}
    </div>
  );
}
