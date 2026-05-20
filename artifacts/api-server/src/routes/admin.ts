import { Router, type IRouter } from "express";
import { db, usersTable, paymentsTable } from "@workspace/db";
import { eq, desc, ilike, sql, or } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import {
  AdminListUsersResponse,
  AdminGetUserResponse,
  AdminUpdateUserBody,
  AdminUpdateUserResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatUser(u: typeof usersTable.$inferSelect, totalPayments?: number, lastPaymentDate?: Date | null) {
  return {
    id: u.id,
    name: u.name,
    phone: u.phone,
    email: u.email,
    subscriptionType: u.subscriptionType,
    trialStartDate: u.trialStartDate?.toISOString() ?? null,
    trialExpiryDate: u.trialExpiryDate?.toISOString() ?? null,
    premiumExpiryDate: u.premiumExpiryDate?.toISOString() ?? null,
    isBlocked: u.isBlocked,
    isAdmin: u.isAdmin,
    createdAt: u.createdAt.toISOString(),
    totalPayments: totalPayments ?? 0,
    lastPaymentDate: lastPaymentDate?.toISOString() ?? null,
  };
}

router.get("/admin/users", requireAdmin, async (req, res): Promise<void> => {
  const page = parseInt(String(req.query.page ?? "1"), 10);
  const limit = parseInt(String(req.query.limit ?? "20"), 10);
  const offset = (page - 1) * limit;
  const search = req.query.search ? String(req.query.search) : null;
  const status = req.query.status ? String(req.query.status) : "all";

  let query = db.select().from(usersTable);
  let countQuery = db.select({ count: sql<number>`count(*)::int` }).from(usersTable);

  // Note: Drizzle doesn't support dynamic where chaining easily, so using raw SQL approach
  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));

  let filtered = users;
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(u =>
      u.name.toLowerCase().includes(s) ||
      u.phone.includes(s) ||
      (u.email && u.email.toLowerCase().includes(s))
    );
  }
  if (status && status !== "all") {
    const now = new Date();
    filtered = filtered.filter(u => {
      if (status === "trial") return u.subscriptionType === "trial" && u.trialExpiryDate && u.trialExpiryDate > now;
      if (status === "premium") return u.subscriptionType === "premium" && u.premiumExpiryDate && u.premiumExpiryDate > now;
      if (status === "expired") return u.subscriptionType === "expired" ||
        (u.subscriptionType === "trial" && u.trialExpiryDate && u.trialExpiryDate <= now) ||
        (u.subscriptionType === "premium" && u.premiumExpiryDate && u.premiumExpiryDate <= now);
      return true;
    });
  }

  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  // Get payment totals for each user
  const userIds = paginated.map(u => u.id);
  const payments = userIds.length > 0
    ? await db.select().from(paymentsTable).where(eq(paymentsTable.status, "success"))
    : [];

  const formatted = paginated.map(u => {
    const userPayments = payments.filter(p => p.userId === u.id);
    const total = userPayments.reduce((s, p) => s + parseFloat(String(p.amount)), 0);
    const last = userPayments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    return formatUser(u, total, last?.createdAt ?? null);
  });

  res.json(AdminListUsersResponse.parse({
    data: formatted,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }));
});

router.get("/admin/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const payments = await db.select().from(paymentsTable)
    .where(eq(paymentsTable.userId, id))
    .orderBy(desc(paymentsTable.createdAt));

  const successPayments = payments.filter(p => p.status === "success");
  const totalAmount = successPayments.reduce((s, p) => s + parseFloat(String(p.amount)), 0);
  const lastPayment = successPayments[0];

  res.json(AdminGetUserResponse.parse(formatUser(user, totalAmount, lastPayment?.createdAt ?? null)));
});

router.put("/admin/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const parsed = AdminUpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.isBlocked != null) updateData.isBlocked = parsed.data.isBlocked;
  if (parsed.data.subscriptionType != null) updateData.subscriptionType = parsed.data.subscriptionType;
  if (parsed.data.premiumExpiryDate != null) updateData.premiumExpiryDate = new Date(parsed.data.premiumExpiryDate);

  const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(AdminUpdateUserResponse.parse(formatUser(user)));
});

export default router;
