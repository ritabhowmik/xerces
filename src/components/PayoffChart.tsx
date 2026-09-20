"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from "recharts";
import type { PayoffPoint } from "@/lib/position";

interface PayoffChartProps {
  data: PayoffPoint[];
  currentSpot: number;
  breakevens: number[];
}

const fmtUsd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: number;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="viz-tooltip rounded-md border px-3 py-2 text-xs shadow-sm">
      <div className="mb-1 font-medium" style={{ color: "var(--text-primary)" }}>
        Stock @ {fmtUsd(label ?? 0)}
      </div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span>{p.name}:</span>
          <span className="font-medium tabular-nums" style={{ color: "var(--text-primary)" }}>
            {fmtUsd(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function PayoffChart({ data, currentSpot, breakevens }: PayoffChartProps) {
  return (
    <div className="viz-root">
      <style>{`
        .viz-root {
          color-scheme: light;
          --surface-1: #fcfcfb;
          --text-primary: #0b0b0b;
          --text-secondary: #52514e;
          --muted: #898781;
          --grid: #e1e0d9;
          --baseline: #c3c2b7;
          --series-1: #2a78d6; /* today */
          --series-2: #eb6834; /* at expiry */
          --good: #0ca30c;
          --critical: #d03b3b;
        }
        @media (prefers-color-scheme: dark) {
          :root:where(:not([data-theme="light"])) .viz-root {
            color-scheme: dark;
            --surface-1: #1a1a19;
            --text-primary: #ffffff;
            --text-secondary: #c3c2b7;
            --muted: #898781;
            --grid: #2c2c2a;
            --baseline: #383835;
            --series-1: #3987e5;
            --series-2: #d95926;
            --good: #0ca30c;
            --critical: #e66767;
          }
        }
        :root[data-theme="dark"] .viz-root {
          color-scheme: dark;
          --surface-1: #1a1a19;
          --text-primary: #ffffff;
          --text-secondary: #c3c2b7;
          --muted: #898781;
          --grid: #2c2c2a;
          --baseline: #383835;
          --series-1: #3987e5;
          --series-2: #d95926;
          --good: #0ca30c;
          --critical: #e66767;
        }
        .viz-tooltip {
          background: var(--surface-1);
          border-color: var(--grid);
        }
      `}</style>
      <div>
        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--good)" stopOpacity={0.18} />
                <stop offset="100%" stopColor="var(--good)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="lossFill" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="var(--critical)" stopOpacity={0.18} />
                <stop offset="100%" stopColor="var(--critical)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis
              dataKey="spot"
              tickFormatter={(v: number) => `$${Math.round(v)}`}
              stroke="var(--muted)"
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "var(--baseline)" }}
            />
            <YAxis
              tickFormatter={(v: number) => fmtUsd(v)}
              stroke="var(--muted)"
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={70}
            />
            <ReferenceLine y={0} stroke="var(--baseline)" strokeWidth={1} />
            <ReferenceLine
              x={currentSpot}
              stroke="var(--muted)"
              strokeDasharray="4 4"
              label={{ value: "Spot", position: "top", fill: "var(--muted)", fontSize: 11 }}
            />
            {breakevens.map((be) => (
              <ReferenceLine key={be} x={be} stroke="var(--muted)" strokeOpacity={0.4} strokeDasharray="2 3" />
            ))}
            <Area
              type="monotone"
              dataKey="atExpiry"
              stroke="none"
              fill="url(#profitFill)"
              isAnimationActive={false}
              legendType="none"
            />
            <Line
              type="monotone"
              dataKey="today"
              name="P&L today"
              stroke="var(--series-1)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="atExpiry"
              name="P&L at expiry"
              stroke="var(--series-2)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }}
              iconType="plainline"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
