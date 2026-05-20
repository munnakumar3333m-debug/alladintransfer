import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, requireAuth } from "../middlewares/auth";
import {
  RegisterBody,
  LoginBody,
  GetMeResponse,
  LoginResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, phone, email, password } = parsed.data;
  const referralCode = (req.body as { referralCode?: string }).referralCode as string | undefined;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.phone, phone));
  if (existing) {
    res.status(409).json({ error: "User with this phone number already exists" });
    return;
  }

  let referrerId: number | undefined;
  if (referralCode) {
    const [referrer] = await db.select().from(usersTable)
      .where(eq(usersTable.referralCode, referralCode.toUpperCase().trim()));
    if (referrer) referrerId = referrer.id;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const trialStart = new Date();
  const trialExpiry = new Date(trialStart.getTime() + 30 * 24 * 60 * 60 * 1000);

  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let newUserCode = "";
  let codeIsUnique = false;
  while (!codeIsUnique) {
    let suffix = "";
    for (let i = 0; i < 4; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
    newUserCode = "REF" + suffix + suffix.split("").reverse().join("").slice(0, 4);
    const [clash] = await db.select({ id: usersTable.id }).from(usersTable)
      .where(eq(usersTable.referralCode, newUserCode));
    if (!clash) codeIsUnique = true;
  }

  const [user] = await db.insert(usersTable).values({
    name,
    phone,
    email: email ?? null,
    password: hashedPassword,
    subscriptionType: "trial",
    trialStartDate: trialStart,
    trialExpiryDate: trialExpiry,
    referralCode: newUserCode,
    referredBy: referrerId ?? null,
  }).returning();

  if (referrerId) {
    const { referralsTable } = await import("@workspace/db");
    await db.insert(referralsTable).values({
      referrerId,
      referredId: user.id,
      status: "pending",
      rewardDays: 30,
    });
  }

  const token = signToken({ userId: user.id, isAdmin: user.isAdmin });

  const responseUser = {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    subscriptionType: user.subscriptionType,
    trialStartDate: user.trialStartDate?.toISOString() ?? null,
    trialExpiryDate: user.trialExpiryDate?.toISOString() ?? null,
    premiumExpiryDate: user.premiumExpiryDate?.toISOString() ?? null,
    isBlocked: user.isBlocked,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt?.toISOString?.() ?? user.createdAt.toISOString(),
  };

  res.status(201).json(LoginResponse.parse({ token, user: responseUser }));
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { phone, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone));
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  if (user.isBlocked) {
    res.status(401).json({ error: "Account is blocked" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const now = new Date();
  let subscriptionType = user.subscriptionType;
  if (subscriptionType === "trial" && user.trialExpiryDate && user.trialExpiryDate < now) {
    subscriptionType = "expired";
    await db.update(usersTable).set({ subscriptionType: "expired" }).where(eq(usersTable.id, user.id));
  }
  if (subscriptionType === "premium" && user.premiumExpiryDate && user.premiumExpiryDate < now) {
    subscriptionType = "expired";
    await db.update(usersTable).set({ subscriptionType: "expired" }).where(eq(usersTable.id, user.id));
  }

  const token = signToken({ userId: user.id, isAdmin: user.isAdmin });
  const responseUser = {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    subscriptionType,
    trialStartDate: user.trialStartDate?.toISOString() ?? null,
    trialExpiryDate: user.trialExpiryDate?.toISOString() ?? null,
    premiumExpiryDate: user.premiumExpiryDate?.toISOString() ?? null,
    isBlocked: user.isBlocked,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt?.toISOString?.() ?? user.createdAt.toISOString(),
  };

  res.json(LoginResponse.parse({ token, user: responseUser }));
});

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  res.json({ message: "If the phone number exists, a reset link will be sent" });
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  res.json({ message: "Password reset is not yet configured" });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const now = new Date();
  let subscriptionType = user.subscriptionType;
  if (subscriptionType === "trial" && user.trialExpiryDate && user.trialExpiryDate < now) subscriptionType = "expired";
  if (subscriptionType === "premium" && user.premiumExpiryDate && user.premiumExpiryDate < now) subscriptionType = "expired";

  const responseUser = {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    subscriptionType,
    trialStartDate: user.trialStartDate?.toISOString() ?? null,
    trialExpiryDate: user.trialExpiryDate?.toISOString() ?? null,
    premiumExpiryDate: user.premiumExpiryDate?.toISOString() ?? null,
    isBlocked: user.isBlocked,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt?.toISOString?.() ?? user.createdAt.toISOString(),
  };

  res.json(GetMeResponse.parse(responseUser));
});

export default router;
