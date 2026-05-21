import { Router, type IRouter } from "express";
import { db, paymentsTable, usersTable, referralsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { z } from "zod";

const GetPaymentHistoryResponse = z.any();
const VerifyPaymentResponse = z.any();
const VerifyPaymentBody = z.object({
  paymentReference: z.string().min(1),
});

const router: IRouter = Router();

const SUBSCRIPTION_AMOUNT = 800;
const UPI_ID = "8429054622@ptaxis";
const MERCHANT_NAME = "AlphaTrade Pro";
const PAYMENT_URI = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=800&cu=INR`;

router.post("/payments/create-order", requireAuth, async (_req, res): Promise<void> => {
  res.status(200).json({
    amount: SUBSCRIPTION_AMOUNT,
    currency: "INR",
    upiId: UPI_ID,
    merchantName: MERCHANT_NAME,
    paymentUri: PAYMENT_URI,
  });
});

router.post("/payments/verify", requireAuth, async (req, res): Promise<void> => {
  const parsed = VerifyPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const now = new Date();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  await db.insert(paymentsTable).values({
    userId: user.id,
    amount: String(SUBSCRIPTION_AMOUNT),
    currency: "INR",
    status: "success",
    razorpayOrderId: parsed.data.paymentReference,
    razorpayPaymentId: parsed.data.paymentReference,
    razorpaySignature: null,
  });

  const baseExpiry = user.premiumExpiryDate && user.premiumExpiryDate > now ? user.premiumExpiryDate : now;
  const premiumExpiryDate = new Date(baseExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);

  await db.update(usersTable).set({
    subscriptionType: "premium",
    premiumExpiryDate,
  }).where(eq(usersTable.id, user.id));

  // Reward referrer if this is the first payment from a referred user
  if (user.referredBy) {
    const [pendingReferral] = await db.select().from(referralsTable).where(
      and(
        eq(referralsTable.referrerId, user.referredBy),
        eq(referralsTable.referredId, user.id),
        eq(referralsTable.status, "pending"),
      )
    );
    if (pendingReferral) {
      const [referrer] = await db.select().from(usersTable).where(eq(usersTable.id, user.referredBy));
      if (referrer) {
        const refBase = referrer.premiumExpiryDate && referrer.premiumExpiryDate > now ? referrer.premiumExpiryDate : now;
        const refExpiry = new Date(refBase.getTime() + pendingReferral.rewardDays * 24 * 60 * 60 * 1000);
        const refType = referrer.subscriptionType === "premium" ? "premium" : "premium";
        await db.update(usersTable).set({
          subscriptionType: refType,
          premiumExpiryDate: refExpiry,
        }).where(eq(usersTable.id, referrer.id));
        await db.update(referralsTable).set({
          status: "rewarded",
          rewardedAt: now,
        }).where(eq(referralsTable.id, pendingReferral.id));
      }
    }
  }

  res.json(VerifyPaymentResponse.parse({
    subscriptionType: "premium",
    trialStartDate: user.trialStartDate?.toISOString() ?? null,
    trialExpiryDate: user.trialExpiryDate?.toISOString() ?? null,
    premiumExpiryDate: premiumExpiryDate.toISOString(),
    daysRemaining: Math.ceil((premiumExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    isActive: true,
  }));
});

router.post("/payments/admin-approve", requireAdmin, async (req, res): Promise<void> => {
  const userId = Number(req.body?.userId);
  if (!Number.isInteger(userId)) {
    res.status(400).json({ error: "Invalid userId" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const now = new Date();
  const baseExpiry = user.premiumExpiryDate && user.premiumExpiryDate > now ? user.premiumExpiryDate : now;
  const premiumExpiryDate = new Date(baseExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);

  await db.update(usersTable).set({
    subscriptionType: "premium",
    premiumExpiryDate,
  }).where(eq(usersTable.id, userId));

  await db.insert(paymentsTable).values({
    userId,
    amount: String(SUBSCRIPTION_AMOUNT),
    currency: "INR",
    status: "success",
    razorpayOrderId: `upi_admin_${Date.now()}`,
    razorpayPaymentId: `upi_admin_${Date.now()}`,
    razorpaySignature: null,
  });

  res.json({ message: "Payment approved", premiumExpiryDate: premiumExpiryDate.toISOString() });
});

router.get("/payments/history", requireAuth, async (req, res): Promise<void> => {
  const payments = await db.select().from(paymentsTable)
    .where(eq(paymentsTable.userId, req.user!.id))
    .orderBy(desc(paymentsTable.createdAt));

  const formatted = payments.map(p => ({
    id: p.id,
    amount: parseFloat(String(p.amount)),
    currency: p.currency,
    status: p.status,
    razorpayOrderId: p.razorpayOrderId,
    razorpayPaymentId: p.razorpayPaymentId,
    createdAt: p.createdAt.toISOString(),
  }));

  res.json(GetPaymentHistoryResponse.parse(formatted));
});

export default router;