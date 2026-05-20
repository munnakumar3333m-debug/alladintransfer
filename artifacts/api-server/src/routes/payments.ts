import { Router, type IRouter } from "express";
import { db, paymentsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import {
  VerifyPaymentBody,
  GetPaymentHistoryResponse,
  VerifyPaymentResponse,
} from "@workspace/api-zod";
import crypto from "crypto";

const router: IRouter = Router();

const SUBSCRIPTION_PRICE = 200000; // ₹2000 in paise

router.post("/payments/create-order", requireAuth, async (req, res): Promise<void> => {
  const orderId = `order_${Date.now()}_${req.user!.id}`;

  // Create pending payment record
  await db.insert(paymentsTable).values({
    userId: req.user!.id,
    amount: "2000.00",
    currency: "INR",
    status: "pending",
    razorpayOrderId: orderId,
  });

  res.status(201).json({
    orderId,
    amount: SUBSCRIPTION_PRICE,
    currency: "INR",
    keyId: process.env.RAZORPAY_KEY_ID ?? "rzp_test_placeholder",
  });
});

router.post("/payments/verify", requireAuth, async (req, res): Promise<void> => {
  const parsed = VerifyPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

  const secret = process.env.RAZORPAY_KEY_SECRET ?? "";
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto.createHmac("sha256", secret).update(body).digest("hex");

  const isValid = !secret || expectedSignature === razorpaySignature;
  if (!isValid) {
    res.status(400).json({ error: "Invalid payment signature" });
    return;
  }

  // Update payment record
  await db.update(paymentsTable)
    .set({ status: "success", razorpayPaymentId, razorpaySignature })
    .where(eq(paymentsTable.razorpayOrderId, razorpayOrderId));

  // Activate premium for 30 days
  const now = new Date();
  const premiumExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await db.update(usersTable).set({
    subscriptionType: "premium",
    premiumExpiryDate: premiumExpiry,
  }).where(eq(usersTable.id, req.user!.id));

  // Reward referrer: give them 30 extra days of premium
  const [payer] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  if (payer?.referredBy) {
    const { referralsTable } = await import("@workspace/db");
    const [referral] = await db.select().from(referralsTable)
      .where(eq(referralsTable.referrerId, payer.referredBy));

    if (referral && referral.status === "pending") {
      const [referrer] = await db.select().from(usersTable).where(eq(usersTable.id, payer.referredBy));
      if (referrer) {
        const REWARD_MS = referral.rewardDays * 24 * 60 * 60 * 1000;
        const baseExpiry =
          referrer.subscriptionType === "premium" && referrer.premiumExpiryDate && referrer.premiumExpiryDate > now
            ? referrer.premiumExpiryDate
            : now;
        const newExpiry = new Date(baseExpiry.getTime() + REWARD_MS);
        await db.update(usersTable).set({
          subscriptionType: "premium",
          premiumExpiryDate: newExpiry,
        }).where(eq(usersTable.id, referrer.id));

        await db.update(referralsTable).set({
          status: "rewarded",
          rewardedAt: now,
        }).where(eq(referralsTable.id, referral.id));
      }
    }
  }

  res.json(VerifyPaymentResponse.parse({
    subscriptionType: "premium",
    premiumExpiryDate: premiumExpiry.toISOString(),
    isActive: true,
    daysRemaining: 30,
  }));
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
