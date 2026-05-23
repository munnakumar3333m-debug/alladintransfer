import Expo, { ExpoPushMessage } from "expo-server-sdk";
import { db, deviceTokensTable, usersTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { logger } from "./logger";

const expo = new Expo({ useFcmV1: true });

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

type TargetType = "all" | "premium" | "trial" | "specific";

export async function sendPushToUsers(
  payload: PushPayload,
  targetType: TargetType = "all",
  userIds?: number[]
): Promise<number> {
  const now = new Date();

  let users = await db.select().from(usersTable);

  if (targetType === "specific" && userIds?.length) {
    users = users.filter((u) => userIds.includes(u.id));
  } else if (targetType === "premium") {
    users = users.filter(
      (u) =>
        u.subscriptionType === "premium" &&
        u.premiumExpiryDate &&
        u.premiumExpiryDate > now
    );
  } else if (targetType === "trial") {
    users = users.filter(
      (u) =>
        u.subscriptionType === "trial" &&
        u.trialExpiryDate &&
        u.trialExpiryDate > now
    );
  }

  if (users.length === 0) return 0;

  const ids = users.map((u) => u.id);
  const tokenRows = await db
    .select()
    .from(deviceTokensTable)
    .where(inArray(deviceTokensTable.userId, ids));

  const validTokens = tokenRows
    .map((r) => r.token)
    .filter((t) => Expo.isExpoPushToken(t));

  if (validTokens.length === 0) return 0;

  const messages: ExpoPushMessage[] = validTokens.map((to) => ({
    to,
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
    sound: "default",
    priority: "high",
    channelId: "default",
  }));

  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      const receipts = await expo.sendPushNotificationsAsync(chunk);
      for (const receipt of receipts) {
        if (receipt.status === "error") {
          logger.warn({ receipt }, "Push notification error");
        }
      }
    } catch (err) {
      logger.error({ err }, "Failed to send push chunk");
    }
  }

  return validTokens.length;
}
