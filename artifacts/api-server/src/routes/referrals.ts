import { Router, type IRouter } from "express";
import { db, usersTable, referralsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

function generateReferralCode(userId: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return "REF" + String(userId).padStart(4, "0") + suffix;
}

router.get("/referrals/my-code", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  let code = user.referralCode;
  if (!code) {
    code = generateReferralCode(user.id);
    await db.update(usersTable).set({ referralCode: code }).where(eq(usersTable.id, user.id));
  }

  const referrals = await db.select().from(referralsTable)
    .where(eq(referralsTable.referrerId, user.id));

  const totalReferrals = referrals.length;
  const rewardedReferrals = referrals.filter((r) => r.status === "rewarded").length;
  const pendingReferrals = referrals.filter((r) => r.status === "pending").length;
  const totalDaysEarned = referrals
    .filter((r) => r.status === "rewarded")
    .reduce((sum, r) => sum + r.rewardDays, 0);

  res.json({ code, totalReferrals, rewardedReferrals, pendingReferrals, totalDaysEarned });
});

router.get("/referrals/my-referrals", requireAuth, async (req, res): Promise<void> => {
  const referrals = await db
    .select({
      id: referralsTable.id,
      referredId: referralsTable.referredId,
      referredName: usersTable.name,
      referredPhone: usersTable.phone,
      status: referralsTable.status,
      rewardDays: referralsTable.rewardDays,
      createdAt: referralsTable.createdAt,
      rewardedAt: referralsTable.rewardedAt,
    })
    .from(referralsTable)
    .innerJoin(usersTable, eq(referralsTable.referredId, usersTable.id))
    .where(eq(referralsTable.referrerId, req.user!.id));

  res.json(
    referrals.map((r) => ({
      id: r.id,
      referredName: r.referredName,
      referredPhone: r.referredPhone,
      status: r.status,
      rewardDays: r.rewardDays,
      createdAt: r.createdAt.toISOString(),
      rewardedAt: r.rewardedAt?.toISOString() ?? null,
    }))
  );
});

router.post("/referrals/apply", requireAuth, async (req, res): Promise<void> => {
  const { code } = req.body as { code: string };
  if (!code) { res.status(400).json({ error: "Referral code is required" }); return; }

  const [currentUser] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  if (currentUser.referredBy) {
    res.status(400).json({ error: "You have already used a referral code" });
    return;
  }

  const [referrer] = await db.select().from(usersTable)
    .where(eq(usersTable.referralCode, code.toUpperCase().trim()));

  if (!referrer) { res.status(400).json({ error: "Invalid referral code" }); return; }
  if (referrer.id === req.user!.id) {
    res.status(400).json({ error: "You cannot use your own referral code" });
    return;
  }

  await db.update(usersTable).set({ referredBy: referrer.id }).where(eq(usersTable.id, req.user!.id));
  await db.insert(referralsTable).values({
    referrerId: referrer.id,
    referredId: req.user!.id,
    status: "pending",
    rewardDays: 30,
  });

  res.json({ message: "Referral code applied! Your friend will earn 30 free days when you subscribe." });
});

router.get("/admin/referrals", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const referrerTable = usersTable;
  const referredTable = db.$with("referred").as(
    db.select().from(usersTable)
  );

  const results = await db
    .select({
      id: referralsTable.id,
      referrerId: referralsTable.referrerId,
      referredId: referralsTable.referredId,
      status: referralsTable.status,
      rewardDays: referralsTable.rewardDays,
      createdAt: referralsTable.createdAt,
      rewardedAt: referralsTable.rewardedAt,
    })
    .from(referralsTable)
    .orderBy(sql`${referralsTable.createdAt} desc`);

  // Fetch user names separately for simplicity
  const userIds = new Set<number>();
  results.forEach((r) => { userIds.add(r.referrerId); userIds.add(r.referredId); });
  const users = await db.select({ id: usersTable.id, name: usersTable.name, phone: usersTable.phone })
    .from(usersTable)
    .where(sql`${usersTable.id} = ANY(ARRAY[${sql.join([...userIds].map(id => sql`${id}`), sql`, `)}])`);
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  res.json(
    results.map((r) => ({
      id: r.id,
      referrerName: userMap[r.referrerId]?.name ?? "Unknown",
      referrerPhone: userMap[r.referrerId]?.phone ?? "",
      referredName: userMap[r.referredId]?.name ?? "Unknown",
      referredPhone: userMap[r.referredId]?.phone ?? "",
      status: r.status,
      rewardDays: r.rewardDays,
      createdAt: r.createdAt.toISOString(),
      rewardedAt: r.rewardedAt?.toISOString() ?? null,
    }))
  );
});

export default router;
