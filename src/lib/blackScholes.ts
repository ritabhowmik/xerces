// Black-Scholes-Merton pricing & Greeks for European options on a stock
// paying a continuous dividend yield q. All rates/vols are annualized;
// T is time to expiry in years.

export type OptionType = "call" | "put";

function erf(x: number): number {
  // Abramowitz & Stegun 7.1.26, accurate to ~1.5e-7
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * ax);
  const y =
    1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return sign * y;
}

export function normCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

export function normPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

export interface BsInputs {
  spot: number; // S
  strike: number; // K
  timeYears: number; // T, in years (can be 0 at/after expiry)
  volatility: number; // sigma, e.g. 0.30 for 30%
  rate: number; // r, e.g. 0.045 for 4.5%
  dividendYield?: number; // q, default 0
}

export interface BsResult {
  price: number;
  delta: number;
  gamma: number;
  // theta/vega below are already converted to trader-friendly units:
  // theta = $ P&L per calendar day; vega = $ P&L per 1 vol point (1%)
  theta: number;
  vega: number;
}

const MIN_T = 1e-6; // ~ a few seconds; avoids div-by-zero without a special case

export function intrinsicValue(type: OptionType, spot: number, strike: number): number {
  return type === "call" ? Math.max(spot - strike, 0) : Math.max(strike - spot, 0);
}

export function blackScholes(type: OptionType, inputs: BsInputs): BsResult {
  const { spot: S, strike: K, volatility: sigma, rate: r } = inputs;
  const q = inputs.dividendYield ?? 0;
  const T = Math.max(inputs.timeYears, 0);

  if (T <= MIN_T || sigma <= 0 || S <= 0 || K <= 0) {
    // At/after expiry (or degenerate inputs): fall back to intrinsic value.
    // Delta approximates the expiry step function; higher-order greeks vanish.
    const price = intrinsicValue(type, S, K);
    const itm = type === "call" ? S > K : S < K;
    const delta = itm ? (type === "call" ? 1 : -1) : 0;
    return { price, delta, gamma: 0, theta: 0, vega: 0 };
  }

  const sqrtT = Math.sqrt(T);
  const d1 =
    (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;

  const Nd1 = normCdf(d1);
  const Nd2 = normCdf(d2);
  const pdfD1 = normPdf(d1);
  const eqT = Math.exp(-q * T);
  const erT = Math.exp(-r * T);

  let price: number;
  let delta: number;
  let annualTheta: number;

  if (type === "call") {
    price = S * eqT * Nd1 - K * erT * Nd2;
    delta = eqT * Nd1;
    annualTheta =
      -(S * eqT * pdfD1 * sigma) / (2 * sqrtT) -
      r * K * erT * Nd2 +
      q * S * eqT * Nd1;
  } else {
    const NmD1 = normCdf(-d1);
    const NmD2 = normCdf(-d2);
    price = K * erT * NmD2 - S * eqT * NmD1;
    delta = -eqT * NmD1;
    annualTheta =
      -(S * eqT * pdfD1 * sigma) / (2 * sqrtT) +
      r * K * erT * NmD2 -
      q * S * eqT * NmD1;
  }

  const gamma = (eqT * pdfD1) / (S * sigma * sqrtT);
  const annualVega = S * eqT * pdfD1 * sqrtT;

  return {
    price,
    delta,
    gamma,
    theta: annualTheta / 365, // $ per calendar day
    vega: annualVega / 100, // $ per 1 vol point (1.00 -> 1.01)
  };
}
