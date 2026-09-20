import { NextRequest, NextResponse } from "next/server";

// Deterministic fallback price so the app works with zero configuration.
// Seeded off the symbol so the same ticker always returns the same mock price
// within a session, instead of jumping around on every refresh.
function mockPrice(symbol: string): number {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = (hash * 31 + symbol.charCodeAt(i)) >>> 0;
  }
  return 50 + (hash % 4500) / 10; // ~$50 - $500
}

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") || "AAPL")
    .toUpperCase()
    .trim();

  if (!/^[A-Z.\-]{1,10}$/.test(symbol)) {
    return NextResponse.json({ error: "Invalid symbol" }, { status: 400 });
  }

  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      symbol,
      price: mockPrice(symbol),
      source: "mock",
      note: "Set FINNHUB_API_KEY to pull live quotes instead of a deterministic mock price.",
    });
  }

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`,
      { next: { revalidate: 10 } }
    );
    if (!res.ok) throw new Error(`Upstream error ${res.status}`);
    const data = await res.json();
    if (!data.c || data.c <= 0) {
      throw new Error("No price returned for symbol");
    }
    return NextResponse.json({
      symbol,
      price: data.c,
      change: data.d,
      changePercent: data.dp,
      source: "finnhub",
    });
  } catch (err) {
    return NextResponse.json({
      symbol,
      price: mockPrice(symbol),
      source: "mock",
      note: `Live quote fetch failed (${(err as Error).message}); showing a mock price instead.`,
    });
  }
}
