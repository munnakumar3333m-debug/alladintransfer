import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { logger } from "./lib/logger";

const SEED_USERS = [
  {
    name: "Admin",
    phone: "8429054622",
    password: "Manish@123",
    isAdmin: true,
    subscriptionType: "premium" as const,
    referralCode: "ADMIN001",
  },
  {
    name: "Demo User",
    phone: "9876543210",
    password: "User@123",
    isAdmin: false,
    subscriptionType: "trial" as const,
    referralCode: "DEMO0001",
    trialStartDate: new Date(),
    trialExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  {
    name: "Premium User",
    phone: "9876543211",
    password: "User@123",
    isAdmin: false,
    subscriptionType: "premium" as const,
    referralCode: "PREM0001",
    premiumExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  },
];

export async function seedDefaultUsers() {
  try {
    for (const user of SEED_USERS) {
      const existing = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.phone, user.phone))
        .limit(1);

      if (existing.length > 0) continue;

      const hashedPassword = await bcrypt.hash(user.password, 12);
      await db.insert(usersTable).values({
        name: user.name,
        phone: user.phone,
        password: hashedPassword,
        isAdmin: user.isAdmin,
        subscriptionType: user.subscriptionType,
        referralCode: user.referralCode,
        trialStartDate: user.trialStartDate,
        trialExpiryDate: user.trialExpiryDate,
        premiumExpiryDate: user.premiumExpiryDate,
      });

      logger.info({ phone: user.phone }, "Seeded default user");
    }
  } catch (err) {
    logger.error({ err }, "Failed to seed default users");
  }
}
