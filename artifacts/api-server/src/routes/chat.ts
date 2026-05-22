import { Router, type IRouter } from "express";
import { db, chatMessagesTable, usersTable } from "@workspace/db";
import { eq, and, desc, isNull, sql } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { todayIST } from "../ist";
import { z } from "zod/v4";

const router: IRouter = Router();

const SendMessageSchema = z.object({ message: z.string().min(1).max(2000) });

function fmt(m: typeof chatMessagesTable.$inferSelect) {
  return {
    id: m.id,
    userId: m.userId,
    message: m.message,
    isAdmin: m.isAdmin,
    readAt: m.readAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
  };
}

router.get("/chat/messages", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.userId, userId))
    .orderBy(desc(chatMessagesTable.createdAt))
    .limit(100);

  await db
    .update(chatMessagesTable)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(chatMessagesTable.userId, userId),
        eq(chatMessagesTable.isAdmin, true),
        isNull(chatMessagesTable.readAt)
      )
    );

  res.json(messages.reverse().map(fmt));
});

router.post("/chat/messages", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const parsed = SendMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const [msg] = await db
    .insert(chatMessagesTable)
    .values({ userId, message: parsed.data.message, isAdmin: false })
    .returning();

  res.status(201).json(fmt(msg));
});

router.get("/chat/conversations", requireAdmin, async (req, res): Promise<void> => {
  const rows = await db
    .select({
      userId: chatMessagesTable.userId,
      lastMessage: sql<string>`(array_agg(${chatMessagesTable.message} ORDER BY ${chatMessagesTable.createdAt} DESC))[1]`,
      lastMessageAt: sql<string>`MAX(${chatMessagesTable.createdAt})`,
      unreadCount: sql<number>`COUNT(*) FILTER (WHERE ${chatMessagesTable.isAdmin} = false AND ${chatMessagesTable.readAt} IS NULL)`,
      userName: usersTable.name,
      userPhone: usersTable.phone,
    })
    .from(chatMessagesTable)
    .innerJoin(usersTable, eq(chatMessagesTable.userId, usersTable.id))
    .groupBy(chatMessagesTable.userId, usersTable.name, usersTable.phone)
    .orderBy(desc(sql`MAX(${chatMessagesTable.createdAt})`));

  res.json(
    rows.map((r) => ({
      userId: r.userId,
      userName: r.userName,
      userPhone: r.userPhone,
      lastMessage: r.lastMessage,
      lastMessageAt: r.lastMessageAt,
      unreadCount: Number(r.unreadCount),
    }))
  );
});

router.get("/chat/conversations/:userId/messages", requireAdmin, async (req, res): Promise<void> => {
  const userId = parseInt(String(req.params.userId), 10);
  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.userId, userId))
    .orderBy(desc(chatMessagesTable.createdAt))
    .limit(200);

  res.json(messages.reverse().map(fmt));
});

router.post("/chat/conversations/:userId/messages", requireAdmin, async (req, res): Promise<void> => {
  const userId = parseInt(String(req.params.userId), 10);
  const parsed = SendMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const [msg] = await db
    .insert(chatMessagesTable)
    .values({ userId, message: parsed.data.message, isAdmin: true })
    .returning();

  res.status(201).json(fmt(msg));
});

router.put("/chat/conversations/:userId/read", requireAdmin, async (req, res): Promise<void> => {
  const userId = parseInt(String(req.params.userId), 10);
  await db
    .update(chatMessagesTable)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(chatMessagesTable.userId, userId),
        eq(chatMessagesTable.isAdmin, false),
        isNull(chatMessagesTable.readAt)
      )
    );
  res.json({ ok: true });
});

export default router;
