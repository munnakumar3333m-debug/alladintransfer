import { logger } from "./logger";

const PHONE_NUMBER_ID = process.env["WHATSAPP_PHONE_NUMBER_ID"];
const ACCESS_TOKEN = process.env["WHATSAPP_ACCESS_TOKEN"];

export async function sendWhatsAppNotification(phones: string[], message: string): Promise<void> {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) return;

  const url = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;

  await Promise.allSettled(
    phones.map(async (phone) => {
      const normalized = phone.replace(/\D/g, "");
      const to = normalized.startsWith("91") ? normalized : `91${normalized}`;
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { body: message },
          }),
        });
        if (!res.ok) {
          const err = await res.text();
          logger.warn({ phone: to, err }, "WhatsApp send failed");
        }
      } catch (err) {
        logger.warn({ err, phone: to }, "WhatsApp request error");
      }
    })
  );
}
