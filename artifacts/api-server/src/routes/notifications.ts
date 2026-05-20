import { Router, type IRouter } from "express";
import { db, notificationsTable, deviceTokensTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import {
  RegisterDeviceBody,
  SendNotificationBody,
  GetNotificationHistoryResponse,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/notifications/register-device", requireAuth, async (req, res): Promise<void> => {
  const parsed = RegisterDeviceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await db.insert(deviceTokensTable).values({
    userId: req.user!.id,
    token: parsed.data.token,
    platform: parsed.data.platform,
  });

  res.json({ message: "Device token registered" });
});

router.post("/notifications/send", requireAdmin, async (req, res): Promise<void> => {
  const parsed = SendNotificationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, body, targetType = "all", userIds } = parsed.data;

  // Get target users
  let users;
  const now = new Date();
  if (targetType === "specific" && userIds && userIds.length > 0) {
    users = await db.select().from(usersTable);
    users = users.filter(u => userIds.includes(u.id));
  } else if (targetType === "premium") {
    users = await db.select().from(usersTable);
    users = users.filter(u => u.subscriptionType === "premium" && u.premiumExpiryDate && u.premiumExpiryDate > now);
  } else if (targetType === "trial") {
    users = await db.select().from(usersTable);
    users = users.filter(u => u.subscriptionType === "trial" && u.trialExpiryDate && u.trialExpiryDate > now);
  } else {
    users = await db.select().from(usersTable);
  }

  const sentCount = users.length;

  logger.info({ title, targetType, sentCount }, "Sending push notification");

  await db.insert(notificationsTable).values({
    title,
    body,
    targetType,
    sentCount,
  });

  res.json({ message: `Notification sent to ${sentCount} users` });
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
