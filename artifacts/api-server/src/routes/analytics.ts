import { Router, type IRouter } from "express";
import { db, recommendationsTable, usersTable, paymentsTable } from "@workspace/db";
import { eq, desc, and, sql, gte, lte, lt } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import {
  GetDashboardStatsResponse,
  GetPerformanceDataResponse,
  GetMonthlyReportResponse,
  GetAdminStatsResponse,
  GetRevenueAnalyticsResponse,
  GetUserGrowthAnalyticsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatRec(r: typeof recommendationsTable.$inferSelect) {
  return {
    id: r.id,
    stockName: r.stockName,
    nseSymbol: r.nseSymbol,
    buyPrice: parseFloat(r.buyPrice),
    targetPrice: parseFloat(r.targetPrice),
    stopLoss: parseFloat(r.stopLoss),
    tradeType: r.tradeType,
    riskLevel: r.riskLevel,
    notes: r.notes,
    status: r.status,
    exitPrice: r.exitPrice != null ? parseFloat(r.exitPrice) : null,
    pnlPercent: r.pnlPercent != null ? parseFloat(r.pnlPercent) : null,
    pnlAbsolute: r.pnlAbsolute != null ? parseFloat(r.pnlAbsolute) : null,
    date: r.date,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

router.get("/analytics/dashboard", requireAuth, async (req, res): Promise<void> => {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));

  const [todayRecs, allClosedRecs, monthRecs, bestTrade, worstTrade, recentRecs] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(recommendationsTable).where(eq(recommendationsTable.date, today)),
    db.select().from(recommendationsTable).where(eq(recommendationsTable.status, "target_hit")),
    db.select().from(recommendationsTable).where(
      and(
        gte(recommendationsTable.date, startOfMonth),
        sql`${recommendationsTable.pnlPercent} IS NOT NULL`
      )
    ),
    db.select().from(recommendationsTable)
      .where(sql`${recommendationsTable.pnlPercent} IS NOT NULL`)
      .orderBy(desc(sql`${recommendationsTable.pnlPercent}::numeric`))
      .limit(1),
    db.select().from(recommendationsTable)
      .where(sql`${recommendationsTable.pnlPercent} IS NOT NULL`)
      .orderBy(sql`${recommendationsTable.pnlPercent}::numeric`)
      .limit(1),
    db.select().from(recommendationsTable)
      .orderBy(desc(recommendationsTable.createdAt))
      .limit(5),
  ]);

  const closedRecs = await db.select().from(recommendationsTable)
    .where(sql`${recommendationsTable.pnlPercent} IS NOT NULL`);

  const totalTrades = closedRecs.length;
  const wins = closedRecs.filter(r => r.pnlPercent != null && parseFloat(r.pnlPercent) > 0).length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

  const monthlyPnl = monthRecs.reduce((sum, r) => {
    return sum + (r.pnlPercent ? parseFloat(r.pnlPercent) : 0);
  }, 0);

  let trialDaysRemaining: number | null = null;
  let premiumDaysRemaining: number | null = null;
  if (user?.subscriptionType === "trial" && user.trialExpiryDate) {
    trialDaysRemaining = Math.max(0, Math.ceil((user.trialExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }
  if (user?.subscriptionType === "premium" && user.premiumExpiryDate) {
    premiumDaysRemaining = Math.max(0, Math.ceil((user.premiumExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  res.json(GetDashboardStatsResponse.parse({
    todayRecommendationsCount: todayRecs[0]?.count ?? 0,
    monthlyProfitPercent: parseFloat(monthlyPnl.toFixed(2)),
    totalTrades,
    winRate: parseFloat(winRate.toFixed(1)),
    subscriptionType: user?.subscriptionType ?? "expired",
    trialDaysRemaining,
    premiumDaysRemaining,
    bestTrade: bestTrade[0] ? formatRec(bestTrade[0]) : null,
    worstTrade: worstTrade[0] ? formatRec(worstTrade[0]) : null,
    recentActivity: recentRecs.map(formatRec),
  }));
});

router.get("/analytics/performance", requireAuth, async (_req, res): Promise<void> => {
  const months = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const startDate = `${monthStr}-01`;
    const endD = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const endDate = endD.toISOString().split("T")[0];

    const recs = await db.select().from(recommendationsTable)
      .where(and(
        gte(recommendationsTable.date, startDate),
        lt(recommendationsTable.date, endDate),
        sql`${recommendationsTable.pnlPercent} IS NOT NULL`
      ));

    const totalTrades = recs.length;
    const wins = recs.filter(r => r.pnlPercent != null && parseFloat(r.pnlPercent) > 0).length;
    const losses = totalTrades - wins;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const totalPnl = recs.reduce((s, r) => s + (r.pnlPercent ? parseFloat(r.pnlPercent) : 0), 0);
    const pnlValues = recs.map(r => r.pnlPercent ? parseFloat(r.pnlPercent) : 0);

    months.push({
      month: monthStr,
      totalTrades,
      wins,
      losses,
      winRate: parseFloat(winRate.toFixed(1)),
      totalPnlPercent: parseFloat(totalPnl.toFixed(2)),
      bestTradePercent: pnlValues.length > 0 ? parseFloat(Math.max(...pnlValues).toFixed(2)) : 0,
      worstTradePercent: pnlValues.length > 0 ? parseFloat(Math.min(...pnlValues).toFixed(2)) : 0,
    });
  }

  res.json(GetPerformanceDataResponse.parse(months));
});

router.get("/analytics/monthly/:month", requireAuth, async (req, res): Promise<void> => {
  const month = String(req.params.month);
  const startDate = `${month}-01`;
  const [year, m] = month.split("-").map(Number);
  const endD = new Date(year, m, 1);
  const endDate = endD.toISOString().split("T")[0];

  const recs = await db.select().from(recommendationsTable)
    .where(and(
      gte(recommendationsTable.date, startDate),
      lt(recommendationsTable.date, endDate)
    ))
    .orderBy(desc(recommendationsTable.date));

  const closedRecs = recs.filter(r => r.pnlPercent != null);
  const totalTrades = closedRecs.length;
  const wins = closedRecs.filter(r => r.pnlPercent != null && parseFloat(r.pnlPercent) > 0).length;
  const losses = totalTrades - wins;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const totalPnl = closedRecs.reduce((s, r) => s + (r.pnlPercent ? parseFloat(r.pnlPercent) : 0), 0);
  const pnlValues = closedRecs.map(r => r.pnlPercent ? parseFloat(r.pnlPercent) : 0);

  res.json(GetMonthlyReportResponse.parse({
    month,
    summary: {
      month,
      totalTrades,
      wins,
      losses,
      winRate: parseFloat(winRate.toFixed(1)),
      totalPnlPercent: parseFloat(totalPnl.toFixed(2)),
      bestTradePercent: pnlValues.length > 0 ? parseFloat(Math.max(...pnlValues).toFixed(2)) : 0,
      worstTradePercent: pnlValues.length > 0 ? parseFloat(Math.min(...pnlValues).toFixed(2)) : 0,
    },
    recommendations: recs.map(formatRec),
  }));
});

// Admin analytics
router.get("/admin/stats", requireAuth, async (_req, res): Promise<void> => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [users, payments, recs] = await Promise.all([
    db.select().from(usersTable),
    db.select().from(paymentsTable).where(eq(paymentsTable.status, "success")),
    db.select().from(recommendationsTable).where(sql`${recommendationsTable.pnlPercent} IS NOT NULL`),
  ]);

  const totalRevenue = payments.reduce((s, p) => s + parseFloat(String(p.amount)), 0);
  const monthRevenue = payments
    .filter(p => p.createdAt >= startOfMonth)
    .reduce((s, p) => s + parseFloat(String(p.amount)), 0);

  const trialUsers = users.filter(u => u.subscriptionType === "trial" && u.trialExpiryDate && u.trialExpiryDate > now).length;
  const premiumUsers = users.filter(u => u.subscriptionType === "premium" && u.premiumExpiryDate && u.premiumExpiryDate > now).length;
  const expiredUsers = users.filter(u => u.subscriptionType === "expired" ||
    (u.subscriptionType === "trial" && u.trialExpiryDate && u.trialExpiryDate <= now) ||
    (u.subscriptionType === "premium" && u.premiumExpiryDate && u.premiumExpiryDate <= now)
  ).length;

  const wins = recs.filter(r => r.pnlPercent != null && parseFloat(r.pnlPercent) > 0).length;
  const avgWinRate = recs.length > 0 ? (wins / recs.length) * 100 : 0;

  const newThisMonth = users.filter(u => u.createdAt >= startOfMonth).length;
  const newLastMonth = users.filter(u => u.createdAt >= startOfLastMonth && u.createdAt < startOfMonth).length;

  res.json(GetAdminStatsResponse.parse({
    totalUsers: users.length,
    activeTrialUsers: trialUsers,
    premiumUsers,
    expiredUsers,
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    monthlyRevenue: parseFloat(monthRevenue.toFixed(2)),
    totalRecommendations: await db.select({ count: sql<number>`count(*)::int` }).from(recommendationsTable).then(r => r[0]?.count ?? 0),
    averageWinRate: parseFloat(avgWinRate.toFixed(1)),
    newUsersThisMonth: newThisMonth,
    newUsersLastMonth: newLastMonth,
  }));
});

router.get("/admin/revenue", requireAuth, async (_req, res): Promise<void> => {
  const now = new Date();
  const monthly = [];
  let totalRevenue = 0;

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const startDate = new Date(d.getFullYear(), d.getMonth(), 1);
    const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 1);

    const monthPayments = await db.select().from(paymentsTable)
      .where(and(
        eq(paymentsTable.status, "success"),
        gte(paymentsTable.createdAt, startDate),
        lt(paymentsTable.createdAt, endDate)
      ));

    const revenue = monthPayments.reduce((s, p) => s + parseFloat(String(p.amount)), 0);
    totalRevenue += revenue;

    monthly.push({
      month: monthStr,
      revenue: parseFloat(revenue.toFixed(2)),
      newSubscriptions: monthPayments.length,
      renewals: 0,
    });
  }

  const avgMonthly = monthly.length > 0 ? totalRevenue / monthly.filter(m => m.revenue > 0).length || 0 : 0;

  res.json(GetRevenueAnalyticsResponse.parse({
    monthly,
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    avgMonthlyRevenue: parseFloat(avgMonthly.toFixed(2)),
  }));
});

router.get("/admin/user-growth", requireAuth, async (_req, res): Promise<void> => {
  const now = new Date();
  const monthly = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const startDate = new Date(d.getFullYear(), d.getMonth(), 1);
    const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const cumulativeDate = endDate;

    const [newUsers, totalUsers, premiumConversions] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(usersTable)
        .where(and(gte(usersTable.createdAt, startDate), lt(usersTable.createdAt, endDate))),
      db.select({ count: sql<number>`count(*)::int` }).from(usersTable)
        .where(lt(usersTable.createdAt, cumulativeDate)),
      db.select({ count: sql<number>`count(*)::int` }).from(paymentsTable)
        .where(and(
          eq(paymentsTable.status, "success"),
          gte(paymentsTable.createdAt, startDate),
          lt(paymentsTable.createdAt, endDate)
        )),
    ]);

    monthly.push({
      month: monthStr,
      newUsers: newUsers[0]?.count ?? 0,
      totalUsers: totalUsers[0]?.count ?? 0,
      premiumConversions: premiumConversions[0]?.count ?? 0,
    });
  }

  res.json(GetUserGrowthAnalyticsResponse.parse({ monthly }));
});

export default router;
