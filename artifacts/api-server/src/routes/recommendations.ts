import { Router, type IRouter } from "express";
import { db, recommendationsTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { todayIST } from "../ist";
import {
  CreateRecommendationBody,
  UpdateRecommendationBody,
  UpdateRecommendationPnlBody,
  GetRecommendationResponse,
  ListRecommendationsResponse,
  GetTodayRecommendationsResponse,
  UpdateRecommendationResponse,
  UpdateRecommendationPnlResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatRec(r: typeof recommendationsTable.$inferSelect) {
  return {
    id: r.id,
    stockName: r.stockName,
    nseSymbol: r.nseSymbol,
    signalType: (r.signalType ?? "BUY") as "BUY" | "SELL",
    buyPrice: r.buyPrice,
    targetPrice: r.targetPrice,
    stopLoss: r.stopLoss,
    tradeType: r.tradeType,
    riskLevel: r.riskLevel,
    notes: r.notes,
    screenshotUrl: r.screenshotUrl,
    screenshots: r.screenshots ?? [],
    status: r.status,
    exitPrice: r.exitPrice != null ? parseFloat(r.exitPrice) : null,
    pnlPercent: r.pnlPercent != null ? parseFloat(r.pnlPercent) : null,
    pnlAbsolute: r.pnlAbsolute != null ? parseFloat(r.pnlAbsolute) : null,
    date: r.date,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function hasActiveSubscription(subscriptionType: string, trialExpiry: Date | null, premiumExpiry: Date | null): boolean {
  const now = new Date();
  if (subscriptionType === "trial" && trialExpiry && trialExpiry > now) return true;
  if (subscriptionType === "premium" && premiumExpiry && premiumExpiry > now) return true;
  return false;
}

router.get("/recommendations/today", requireAuth, async (req, res): Promise<void> => {
  const today = todayIST();

  const recs = await db.select().from(recommendationsTable)
    .where(eq(recommendationsTable.date, today))
    .orderBy(desc(recommendationsTable.createdAt));

  res.json(GetTodayRecommendationsResponse.parse(recs.map(formatRec)));
});

router.get("/recommendations", requireAuth, async (req, res): Promise<void> => {
  const page = parseInt(String(req.query.page ?? "1"), 10);
  const limit = parseInt(String(req.query.limit ?? "20"), 10);
  const offset = (page - 1) * limit;

  const conditions = [];
  if (req.query.date) conditions.push(eq(recommendationsTable.date, String(req.query.date)));
  if (req.query.tradeType) conditions.push(eq(recommendationsTable.tradeType, String(req.query.tradeType)));
  if (req.query.status) conditions.push(eq(recommendationsTable.status, String(req.query.status)));
  if (req.query.signalType) conditions.push(eq(recommendationsTable.signalType, String(req.query.signalType)));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult, recs] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(recommendationsTable).where(whereClause),
    db.select().from(recommendationsTable).where(whereClause)
      .orderBy(desc(recommendationsTable.date), desc(recommendationsTable.createdAt))
      .limit(limit).offset(offset),
  ]);

  const total = totalResult[0]?.count ?? 0;

  res.json(ListRecommendationsResponse.parse({
    data: recs.map(formatRec),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }));
});

router.get("/recommendations/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [rec] = await db.select().from(recommendationsTable).where(eq(recommendationsTable.id, id));
  if (!rec) {
    res.status(404).json({ error: "Recommendation not found" });
    return;
  }

  res.json(GetRecommendationResponse.parse(formatRec(rec)));
});

router.post("/recommendations", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateRecommendationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const today = todayIST();
  const rawDate = parsed.data.date;
  const insertDate: string = rawDate instanceof Date ? rawDate.toISOString().split("T")[0] : (rawDate ?? today);
  const [rec] = await db.insert(recommendationsTable).values({
    stockName: parsed.data.stockName,
    nseSymbol: parsed.data.nseSymbol,
    signalType: parsed.data.signalType ?? "BUY",
    buyPrice: parsed.data.buyPrice,
    targetPrice: parsed.data.targetPrice,
    stopLoss: parsed.data.stopLoss,
    tradeType: parsed.data.tradeType,
    riskLevel: parsed.data.riskLevel ?? "medium",
    notes: parsed.data.notes ?? null,
    screenshotUrl: parsed.data.screenshotUrl ?? null,
    screenshots: parsed.data.screenshots ?? null,
    date: insertDate,
    status: "active",
  }).returning();

  res.status(201).json(GetRecommendationResponse.parse(formatRec(rec)));
});

router.put("/recommendations/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const parsed = UpdateRecommendationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.stockName != null) updateData.stockName = parsed.data.stockName;
  if (parsed.data.nseSymbol != null) updateData.nseSymbol = parsed.data.nseSymbol;
  if (parsed.data.signalType != null) updateData.signalType = parsed.data.signalType;
  if (parsed.data.buyPrice != null) updateData.buyPrice = parsed.data.buyPrice;
  if (parsed.data.targetPrice != null) updateData.targetPrice = parsed.data.targetPrice;
  if (parsed.data.stopLoss != null) updateData.stopLoss = parsed.data.stopLoss;
  if (parsed.data.tradeType != null) updateData.tradeType = parsed.data.tradeType;
  if (parsed.data.riskLevel != null) updateData.riskLevel = parsed.data.riskLevel;
  if (parsed.data.notes != null) updateData.notes = parsed.data.notes;
  if (parsed.data.screenshotUrl != null) updateData.screenshotUrl = parsed.data.screenshotUrl;
  if (parsed.data.screenshots != null) updateData.screenshots = parsed.data.screenshots;
  if (parsed.data.date != null) updateData.date = parsed.data.date;

  const [rec] = await db.update(recommendationsTable).set(updateData).where(eq(recommendationsTable.id, id)).returning();
  if (!rec) {
    res.status(404).json({ error: "Recommendation not found" });
    return;
  }

  res.json(UpdateRecommendationResponse.parse(formatRec(rec)));
});

router.delete("/recommendations/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [rec] = await db.delete(recommendationsTable).where(eq(recommendationsTable.id, id)).returning();
  if (!rec) {
    res.status(404).json({ error: "Recommendation not found" });
    return;
  }

  res.sendStatus(204);
});

router.put("/recommendations/:id/pnl", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const parsed = UpdateRecommendationPnlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(recommendationsTable).where(eq(recommendationsTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Recommendation not found" });
    return;
  }

  const exitPrice = parsed.data.exitPrice;
  const buyPrice = parseFloat(existing.buyPrice);
  const pnlPercent = ((exitPrice - buyPrice) / buyPrice) * 100;
  const pnlAbsolute = exitPrice - buyPrice;

  const [rec] = await db.update(recommendationsTable).set({
    exitPrice: String(exitPrice),
    status: parsed.data.status,
    pnlPercent: String(pnlPercent.toFixed(4)),
    pnlAbsolute: String(pnlAbsolute.toFixed(2)),
    notes: parsed.data.notes ?? existing.notes,
  }).where(eq(recommendationsTable.id, id)).returning();

  res.json(UpdateRecommendationPnlResponse.parse(formatRec(rec)));
});

export default router;
