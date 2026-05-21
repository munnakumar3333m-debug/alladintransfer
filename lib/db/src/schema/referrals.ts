import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const referralsTable = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => usersTable.id),
  referredId: integer("referred_id").notNull().references(() => usersTable.id),
  status: text("status").notNull().default("pending"), // pending | rewarded
  rewardDays: integer("reward_days").notNull().default(7),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  rewardedAt: timestamp("rewarded_at", { withTimezone: true }),
});

export type Referral = typeof referralsTable.$inferSelect;
