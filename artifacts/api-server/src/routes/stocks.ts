import { Router } from "express";

const router = Router();

const INTERVAL_MAP: Record<string, string> = {
  "1d":  "5m",
  "5d":  "30m",
  "1mo": "1d",
  "3mo": "1d",
};

router.get("/stocks/chart", async (req, res) => {
  const symbol = (req.query.symbol as string | undefined)?.trim();
  const range  = (req.query.range  as string | undefined) || "1mo";

  if (!symbol) {
    res.status(400).json({ error: "symbol is required" });
    return;
  }

  const interval   = INTERVAL_MAP[range] ?? "1d";
  const yahooSym   = symbol.includes(".") ? symbol : `${symbol}.NS`;
  const url        =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}` +
    `?interval=${interval}&range=${range}`;

  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
    });

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: "Yahoo Finance error" });
      return;
    }

    const json = (await upstream.json()) as {
      chart: {
        result: Array<{
          meta: { regularMarketPrice: number; currency: string; symbol: string };
          timestamp: number[];
          indicators: { quote: Array<{ close: (number | null)[] }> };
        }> | null;
        error: unknown;
      };
    };

    if (!json.chart.result?.length) {
      res.status(404).json({ error: "No data found for symbol" });
      return;
    }

    const result     = json.chart.result[0];
    const timestamps = result.timestamp;
    const closes     = result.indicators.quote[0].close;
    const meta       = result.meta;

    const points: { time: number; close: number }[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const c = closes[i];
      if (c != null) {
        points.push({ time: timestamps[i] * 1000, close: Number(c.toFixed(2)) });
      }
    }

    res.json({
      symbol: meta.symbol,
      currency: meta.currency,
      currentPrice: meta.regularMarketPrice,
      range,
      interval,
      points,
    });
  } catch (err) {
    req.log.error(err, "stocks/chart fetch failed");
    res.status(500).json({ error: "Failed to fetch chart data" });
  }
});

export default router;
