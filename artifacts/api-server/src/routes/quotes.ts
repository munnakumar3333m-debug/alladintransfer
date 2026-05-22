import { Router, type IRouter } from "express";
import { db, dailyQuotesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { todayIST } from "../ist";

const router: IRouter = Router();

router.get("/quotes/today", requireAuth, async (req, res) => {
  const [quote] = await db
    .select()
    .from(dailyQuotesTable)
    .where(eq(dailyQuotesTable.date, todayIST()))
    .limit(1);

  if (!quote) {
    res.status(404).json({ error: "No quote today" });
    return;
  }
  res.json({
    id: quote.id,
    quote: quote.quote,
    author: quote.author ?? null,
    date: quote.date,
    createdAt: quote.createdAt.toISOString(),
  });
});

router.post("/quotes", requireAdmin, async (req, res) => {
  const { quote, author } = req.body as { quote?: string; author?: string };
  if (!quote || typeof quote !== "string" || quote.trim() === "") {
    res.status(400).json({ error: "quote is required" });
    return;
  }

  const today = todayIST();
  const [existing] = await db
    .select()
    .from(dailyQuotesTable)
    .where(eq(dailyQuotesTable.date, today))
    .limit(1);

  let row;
  if (existing) {
    [row] = await db
      .update(dailyQuotesTable)
      .set({ quote: quote.trim(), author: author?.trim() ?? null })
      .where(eq(dailyQuotesTable.date, today))
      .returning();
  } else {
    [row] = await db
      .insert(dailyQuotesTable)
      .values({ quote: quote.trim(), author: author?.trim() ?? null, date: today })
      .returning();
  }

  res.status(existing ? 200 : 201).json({
    id: row!.id,
    quote: row!.quote,
    author: row!.author ?? null,
    date: row!.date,
    createdAt: row!.createdAt.toISOString(),
  });
});

export default router;
