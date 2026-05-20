import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { GetSubscriptionStatusResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/subscriptions/status", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const now = new Date();
  let subscriptionType = user.subscriptionType;
  let daysRemaining: number | null = null;

  if (subscriptionType === "trial" && user.trialExpiryDate) {
    if (user.trialExpiryDate > now) {
      daysRemaining = Math.ceil((user.trialExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      subscriptionType = "expired";
    }
  }
  if (subscriptionType === "premium" && user.premiumExpiryDate) {
    if (user.premiumExpiryDate > now) {
      daysRemaining = Math.ceil((user.premiumExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      subscriptionType = "expired";
    }
  }

  const isActive = subscriptionType !== "expired";

  res.json(GetSubscriptionStatusResponse.parse({
    subscriptionType,
    trialStartDate: user.trialStartDate?.toISOString() ?? null,
    trialExpiryDate: user.trialExpiryDate?.toISOString() ?? null,
    premiumExpiryDate: user.premiumExpiryDate?.toISOString() ?? null,
    daysRemaining,
    isActive,
  }));
});

export default router;
