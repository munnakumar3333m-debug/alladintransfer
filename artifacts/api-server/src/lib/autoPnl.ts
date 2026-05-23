import { db, recommendationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  isConfigured,
  getSymbolToken,
  getCandleData,
} from "./angelone";
import { logger } from "./logger";
import { sendPushToUsers } from "./pushNotifications";

const TARGET_PCT = 2.0;

interface DayOhlc {
  open: number;
  high: number;
  low: number;
  close: number;
}

async function fetchOhlcAngelOne(symbol: string, dateStr: string): Promise<DayOhlc | null> {
  try {
    const token = await getSymbolToken(symbol);
    if (!token) return null;

    const from = `${dateStr} 09:00`;
    const to   = `${dateStr} 15:30`;

    const candles = await getCandleData(token, "ONE_DAY", from, to);
    if (!candles.length) return null;

    const [, open, high, low, close] = candles[0];
    return { open, high, low, close };
  } catch (err) {
    logger.warn({ symbol, err }, "Angel One OHLC fetch failed");
    return null;
  }
}

async function fetchOhlcYahoo(symbol: string, dateStr: string): Promise<DayOhlc | null> {
  try {
    const yahooSym = `${symbol.toUpperCase()}.NS`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}?interval=1d&range=5d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as {
      chart: {
        result: Array<{
          timestamp: number[];
          indicators: {
            quote: Array<{
              open: number[];
              high: number[];
              low: number[];
              close: number[];
            }>;
          };
        }> | null;
      };
    };

    const result = json.chart.result?.[0];
    if (!result) return null;

    const targetDate = new Date(`${dateStr}T00:00:00+05:30`).getTime() / 1000;
    const idx = result.timestamp.findIndex((ts) => {
      const d = new Date(ts * 1000);
      const dStr = d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      return dStr === dateStr;
    });

    if (idx === -1) return null;

    const q = result.indicators.quote[0];
    return {
      open:  q.open[idx],
      high:  q.high[idx],
      low:   q.low[idx],
      close: q.close[idx],
    };
  } catch (err) {
    logger.warn({ symbol, err }, "Yahoo OHLC fetch failed");
    return null;
  }
}

async function fetchOhlc(symbol: string, dateStr: string): Promise<DayOhlc | null> {
  if (isConfigured()) {
    const data = await fetchOhlcAngelOne(symbol, dateStr);
    if (data) return data;
  }
  return fetchOhlcYahoo(symbol, dateStr);
}

export async function runAutoPnl(): Promise<void> {
  const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const todayStr = nowIST.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  logger.info({ date: todayStr }, "Auto P&L: starting");

  const recs = await db
    .select()
    .from(recommendationsTable)
    .where(
      and(
        eq(recommendationsTable.date, todayStr),
        eq(recommendationsTable.status, "active")
      )
    );

  if (!recs.length) {
    logger.info("Auto P&L: no active recommendations for today");
    return;
  }

  logger.info({ count: recs.length }, "Auto P&L: processing recommendations");

  for (const rec of recs) {
    try {
      const symbol = rec.nseSymbol;
      const signal = (rec.signalType ?? "BUY").toUpperCase();

      const ohlc = await fetchOhlc(symbol, todayStr);
      if (!ohlc || !ohlc.open) {
        logger.warn({ symbol }, "Auto P&L: could not fetch OHLC, skipping");
        continue;
      }

      const entryPrice = ohlc.open;
      const targetMultiplier = signal === "SELL" ? (1 - TARGET_PCT / 100) : (1 + TARGET_PCT / 100);
      const targetPrice = entryPrice * targetMultiplier;

      let exitPrice: number;
      let finalStatus: "target_hit" | "closed";

      if (signal === "BUY") {
        if (ohlc.high >= targetPrice) {
          exitPrice = targetPrice;
          finalStatus = "target_hit";
        } else {
          exitPrice = ohlc.close;
          finalStatus = "closed";
        }
      } else {
        if (ohlc.low <= targetPrice) {
          exitPrice = targetPrice;
          finalStatus = "target_hit";
        } else {
          exitPrice = ohlc.close;
          finalStatus = "closed";
        }
      }

      let pnlPercent: number;
      if (signal === "SELL") {
        pnlPercent = ((entryPrice - exitPrice) / entryPrice) * 100;
      } else {
        pnlPercent = ((exitPrice - entryPrice) / entryPrice) * 100;
      }
      const pnlAbsolute = exitPrice - entryPrice;

      await db
        .update(recommendationsTable)
        .set({
          status: finalStatus,
          exitPrice: exitPrice.toFixed(2),
          pnlPercent: pnlPercent.toFixed(2),
          pnlAbsolute: pnlAbsolute.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(recommendationsTable.id, rec.id));

      const emoji = finalStatus === "target_hit" ? "🎯" : pnlPercent >= 0 ? "✅" : "❌";
      const pnlStr = `${pnlPercent >= 0 ? "+" : ""}${pnlPercent.toFixed(2)}%`;

      logger.info({ symbol, signal, entryPrice, exitPrice, pnlPercent, finalStatus }, "Auto P&L: updated");

      sendPushToUsers(
        {
          title: `${emoji} ${symbol} — ${finalStatus === "target_hit" ? "Target Hit!" : "Trade Closed"}`,
          body: `${signal} @ ₹${entryPrice.toFixed(2)} → Exit ₹${exitPrice.toFixed(2)} · P&L: ${pnlStr}`,
          data: { type: "pnl_update", id: rec.id },
        },
        "all"
      ).catch(() => {});

    } catch (err) {
      logger.error({ recId: rec.id, err }, "Auto P&L: failed to process recommendation");
    }
  }

  logger.info("Auto P&L: completed");
}
