import { Router, type IRouter } from "express";
import { db, communityMessagesTable, usersTable } from "@workspace/db";
import { eq, desc, gte } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { z } from "zod/v4";

const router: IRouter = Router();

const PostSchema = z.object({ message: z.string().min(1).max(1000) });

function startOfDayIST(): Date {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - 5.5 * 60 * 60 * 1000);
}

router.get("/community", requireAuth, async (req, res): Promise<void> => {
  const since = startOfDayIST();
  const rows = await db
    .select({
      id: communityMessagesTable.id,
      userId: communityMessagesTable.userId,
      message: communityMessagesTable.message,
      createdAt: communityMessagesTable.createdAt,
      userName: usersTable.name,
    })
    .from(communityMessagesTable)
    .innerJoin(usersTable, eq(communityMessagesTable.userId, usersTable.id))
    .where(gte(communityMessagesTable.createdAt, since))
    .orderBy(desc(communityMessagesTable.createdAt))
    .limit(200);

  res.json(rows.reverse().map((r) => ({
    id: r.id,
    userId: r.userId,
    userName: r.userName ?? "Member",
    message: r.message,
    createdAt: r.createdAt.toISOString(),
  })));
});

router.post("/community", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const parsed = PostSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Message required (max 1000 chars)" });
    return;
  }

  const [row] = await db
    .insert(communityMessagesTable)
    .values({ userId, message: parsed.data.message })
    .returning();

  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId));

  res.status(201).json({
    id: row.id,
    userId: row.userId,
    userName: user?.name ?? "Member",
    message: row.message,
    createdAt: row.createdAt.toISOString(),
  });
});

export default router;
