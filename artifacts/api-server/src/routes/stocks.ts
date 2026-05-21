import { Router } from "express";
import {
  isConfigured,
  getSymbolToken,
  getCandleData,
  type AngelInterval,
} from "../lib/angelone";

const router = Router();

/* ── date helpers ─────────────────────────────────────────── */
function fmt(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

function rangeParams(range: string): {
  interval: AngelInterval;
  fromdate: string;
  todate: string;
} {
  const now = new Date();
  const to = new Date(now);
  to.setHours(15, 30, 0, 0);
  if (to > now) to.setTime(now.getTime());

  const from = new Date(to);
  let interval: AngelInterval = "ONE_DAY";

  switch (range) {
    case "1d":
      from.setHours(9, 15, 0, 0);
      interval = "FIVE_MINUTE";
      break;
    case "5d":
      from.setDate(from.getDate() - 7);
      from.setHours(9, 15, 0, 0);
      interval = "THIRTY_MINUTE";
      break;
    case "3mo":
      from.setMonth(from.getMonth() - 3);
      from.setHours(9, 15, 0, 0);
      interval = "ONE_DAY";
      break;
    default: // 1mo
      from.setMonth(from.getMonth() - 1);
      from.setHours(9, 15, 0, 0);
      interval = "ONE_DAY";
  }

  return { interval, fromdate: fmt(from), todate: fmt(to) };
}

/* ── Yahoo Finance fallback ───────────────────────────────── */
const YF_INTERVAL: Record<string, string> = {
  "1d": "5m",
  "5d": "30m",
  "1mo": "1d",
  "3mo": "1d",
};

async function yahooChart(
  symbol: string,
  range: string
): Promise<{ time: number; close: number }[]> {
  const interval = YF_INTERVAL[range] ?? "1d";
  const yahooSym = symbol.includes(".") ? symbol : `${symbol}.NS`;
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}` +
    `?interval=${interval}&range=${range}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`);

  const json = (await res.json()) as {
    chart: {
      result: Array<{
        meta: { regularMarketPrice: number; currency: string; symbol: string };
        timestamp: number[];
        indicators: { quote: Array<{ close: (number | null)[] }> };
      }> | null;
    };
  };

  const result = json.chart.result?.[0];
  if (!result) throw new Error("No Yahoo data");

  const pts: { time: number; close: number }[] = [];
  const closes = result.indicators.quote[0].close;
  for (let i = 0; i < result.timestamp.length; i++) {
    const c = closes[i];
    if (c != null) pts.push({ time: result.timestamp[i] * 1000, close: Number(c.toFixed(2)) });
  }
  return pts;
}

/* ── Route ───────────────────────────────────────────────── */
router.get("/stocks/chart", async (req, res) => {
  const symbol = (req.query.symbol as string | undefined)?.trim().toUpperCase();
  const range = (req.query.range as string | undefined) ?? "1mo";

  if (!symbol) {
    res.status(400).json({ error: "symbol is required" });
    return;
  }

  try {
    /* ── Angel One path ── */
    if (isConfigured()) {
      const token = await getSymbolToken(symbol);
      if (!token) {
        res.status(404).json({ error: `Symbol ${symbol} not found in NSE instruments` });
        return;
      }

      const { interval, fromdate, todate } = rangeParams(range);
      const candles = await getCandleData(token, interval, fromdate, todate);

      const points = candles.map(([datetime, , , , close]) => ({
        time: new Date(datetime).getTime(),
        close: Number(Number(close).toFixed(2)),
      }));

      const currentPrice = points.at(-1)?.close ?? 0;

      res.json({
        symbol,
        source: "angelone",
        currency: "INR",
        currentPrice,
        range,
        interval,
        points,
      });
      return;
    }

    /* ── Yahoo Finance fallback ── */
    const points = await yahooChart(symbol, range);
    res.json({
      symbol,
      source: "yahoo",
      currency: "INR",
      currentPrice: points.at(-1)?.close ?? 0,
      range,
      points,
    });
  } catch (err) {
    req.log.error(err, "stocks/chart failed");
    res.status(500).json({ error: err instanceof Error ? err.message : "Chart fetch failed" });
  }
});

export default router;
