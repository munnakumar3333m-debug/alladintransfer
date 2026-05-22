import { pgTable, serial, integer, date, unique } from "drizzle-orm/pg-core";

export const userSkipsTable = pgTable("user_skips", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  skipDate: date("skip_date").notNull(),
}, (t) => ({
  uniqueUserDate: unique().on(t.userId, t.skipDate),
}));

export type UserSkip = typeof userSkipsTable.$inferSelect;
export type InsertUserSkip = typeof userSkipsTable.$inferInsert;
