import { pgTable, text, serial, timestamp, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const recommendationsTable = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  stockName: text("stock_name").notNull(),
  nseSymbol: text("nse_symbol").notNull(),
  signalType: text("signal_type").notNull().default("BUY"),
  buyPrice: text("buy_price").notNull(),
  targetPrice: text("target_price").notNull(),
  stopLoss: text("stop_loss").notNull(),
  tradeType: text("trade_type").notNull(),
  riskLevel: text("risk_level").notNull().default("medium"),
  notes: text("notes"),
  screenshotUrl: text("screenshot_url"),
  screenshots: text("screenshots").array(),
  status: text("status").notNull().default("active"),
  exitPrice: numeric("exit_price", { precision: 10, scale: 2 }),
  pnlPercent: numeric("pnl_percent", { precision: 10, scale: 4 }),
  pnlAbsolute: numeric("pnl_absolute", { precision: 10, scale: 2 }),
  date: date("date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRecommendationSchema = createInsertSchema(recommendationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type Recommendation = typeof recommendationsTable.$inferSelect;
