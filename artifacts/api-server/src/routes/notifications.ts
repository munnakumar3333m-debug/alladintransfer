import { Router, type IRouter } from "express";
import { db, notificationsTable, deviceTokensTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { sendPushToUsers } from "../lib/pushNotifications";
import { z } from "zod";
import { logger } from "../lib/logger";

const GetNotificationHistoryResponse = z.any();
const RegisterDeviceBody = z.object({
  token: z.string().min(1),
  platform: z.enum(["ios", "android", "web"]),
});
const SendNotificationBody = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  targetType: z.enum(["all", "premium", "trial", "specific"]).optional(),
  userIds: z.array(z.number()).optional(),
});

const router: IRouter = Router();

router.post("/notifications/register-device", requireAuth, async (req, res): Promise<void> => {
  const parsed = RegisterDeviceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { token, platform } = parsed.data;
  const userId = req.user!.id;

  const existing = await db
    .select()
    .from(deviceTokensTable)
    .where(eq(deviceTokensTable.token, token));

  if (existing.length === 0) {
    await db.insert(deviceTokensTable).values({ userId, token, platform });
    logger.info({ userId, platform }, "Device token registered");
  }

  res.json({ message: "Device token registered" });
});

router.post("/notifications/send", requireAdmin, async (req, res): Promise<void> => {
  const parsed = SendNotificationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, body, targetType = "all", userIds } = parsed.data;

  const sentCount = await sendPushToUsers({ title, body }, targetType, userIds);

  logger.info({ title, targetType, sentCount }, "Push notification sent");

  await db.insert(notificationsTable).values({
    title,
    body,
    targetType,
    sentCount,
  });

  res.json({ message: `Notification sent to ${sentCount} devices` });
});

router.get("/notifications/history", requireAdmin, async (_req, res): Promise<void> => {
  const notifications = await db.select().from(notificationsTable)
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);

  res.json(GetNotificationHistoryResponse.parse(notifications.map(n => ({
    id: n.id,
    title: n.title,
    body: n.body,
    targetType: n.targetType,
    sentCount: n.sentCount,
    createdAt: n.createdAt.toISOString(),
  }))));
});

export default router;
