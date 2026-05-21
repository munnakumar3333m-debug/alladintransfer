import { pgTable, text, serial, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dailyQuotesTable = pgTable("daily_quotes", {
  id: serial("id").primaryKey(),
  quote: text("quote").notNull(),
  author: text("author"),
  date: date("date").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDailyQuoteSchema = createInsertSchema(dailyQuotesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDailyQuote = z.infer<typeof insertDailyQuoteSchema>;
export type DailyQuote = typeof dailyQuotesTable.$inferSelect;
