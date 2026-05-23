import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const communityMessagesTable = pgTable("community_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CommunityMessage = typeof communityMessagesTable.$inferSelect;
export type InsertCommunityMessage = typeof communityMessagesTable.$inferInsert;
