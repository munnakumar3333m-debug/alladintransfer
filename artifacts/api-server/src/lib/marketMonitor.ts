import { db, recommendationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { getLtpBatch, getSymbolToken, getCandleData, isConfigured } from "./angelone";
import { logger } from "./logger";
import { sendPushToUsers } from "./pushNotifications";

const TARGET_PCT = 2.0;

// Cache opening prices per symbol per date — fetched once, reused every poll
const openPriceCache = new Map<string, { date: string; open: number }>();

function istNow(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
}

function todayIST(): string {
  return istNow().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function isMarketHours(): boolean {
  const now = istNow();
  const hm = now.getHours() * 100 + now.getMinutes();
  const day = now.getDay(); // 0=Sun, 6=Sat
  return day >= 1 && day <= 5 && hm >= 915 && hm <= 1530;
}

async function getOpeningPrice(symbol: string, dateStr: string): Promise<number | null> {
  const key = symbol.toUpperCase();
  const cached = openPriceCache.get(key);
  if (cached?.date === dateStr) return cached.open;

  // Angel One: fetch first 1-min candle at 9:15
  if (isConfigured()) {
    try {
      const token = await getSymbolToken(symbol);
      if (token) {
        const candles = await getCandleData(token, "ONE_MINUTE", `${dateStr} 09:00`, `${dateStr} 09:20`);
        // Pick the 9:15 candle open (first candle after market opens)
        const open = candles[0]?.[1];
        if (open) {
          openPriceCache.set(key, { date: dateStr, open });
          return open;
        }
      }
    } catch (err) {
      logger.warn({ symbol, err }, "Market monitor: Angel One opening price fetch failed");
    }
  }

  // Yahoo Finance fallback — intraday 5m candle, first open
  try {
    const yahooSym = `${symbol.toUpperCase()}.NS`;
    const r = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}?interval=5m&range=1d`,
      { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" } }
    );
    if (!r.ok) return null;
    const j = (await r.json()) as {
      chart: {
        result: Array<{
          indicators: { quote: Array<{ open: number[] }> };
        }> | null;
      };
    };
    const open = j.chart.result?.[0]?.indicators?.quote?.[0]?.open?.find((v) => v != null);
    if (open) {
      openPriceCache.set(key, { date: dateStr, open });
      return open;
    }
  } catch (err) {
    logger.warn({ symbol, err }, "Market monitor: Yahoo opening price fetch failed");
  }

  return null;
}

let isRunning = false;

export async function checkTargetsNow(): Promise<void> {
  if (!isMarketHours()) return;
  if (isRunning) return; // prevent overlapping runs
  isRunning = true;

  try {
    const dateStr = todayIST();

    const recs = await db
      .select()
      .from(recommendationsTable)
      .where(
        and(
          eq(recommendationsTable.date, dateStr),
          eq(recommendationsTable.status, "active")
        )
      );

    if (!recs.length) return;

    const symbols = [...new Set(recs.map((r) => r.nseSymbol))];
    const ltpResults = await getLtpBatch(symbols);
    const ltpMap = new Map(ltpResults.map((r) => [r.symbol.toUpperCase(), r.ltp]));

    for (const rec of recs) {
      const symbol = rec.nseSymbol.toUpperCase();
      const ltp = ltpMap.get(symbol);
      if (!ltp) continue;

      const signal = (rec.signalType ?? "BUY").toUpperCase();
      const openPrice = await getOpeningPrice(symbol, dateStr);
      if (!openPrice) continue;

      const targetPrice =
        signal === "SELL"
          ? openPrice * (1 - TARGET_PCT / 100)
          : openPrice * (1 + TARGET_PCT / 100);

      const targetHit =
        signal === "SELL" ? ltp <= targetPrice : ltp >= targetPrice;

      if (!targetHit) continue;

      const exitPrice = parseFloat(targetPrice.toFixed(2));
      const pnlPercent = TARGET_PCT; // always +2.00 on target hit
      const pnlAbsolute =
        signal === "SELL"
          ? openPrice - exitPrice   // SELL profit = entry − exit
          : exitPrice - openPrice;  // BUY profit  = exit  − entry

      await db
        .update(recommendationsTable)
        .set({
          status: "target_hit",
          exitPrice: exitPrice.toFixed(2),
          pnlPercent: pnlPercent.toFixed(2),
          pnlAbsolute: pnlAbsolute.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(recommendationsTable.id, rec.id));

      logger.info(
        { symbol, signal, openPrice, ltp, targetPrice, pnlPercent },
        "Market monitor: target hit — updated immediately"
      );

      sendPushToUsers(
        {
          title: `🎯 ${symbol} — Target Hit!`,
          body: `${signal} @ ₹${openPrice.toFixed(2)} → Hit ₹${exitPrice.toFixed(2)} · P&L: +${pnlPercent.toFixed(2)}%`,
          data: { type: "target_hit", id: rec.id },
        },
        "all"
      ).catch(() => {});
    }
  } catch (err) {
    logger.error({ err }, "Market monitor: checkTargetsNow error");
  } finally {
    isRunning = false;
  }
}
