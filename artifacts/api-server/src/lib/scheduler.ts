import cron from "node-cron";
import { runAutoPnl } from "./autoPnl";
import { checkTargetsNow } from "./marketMonitor";
import { logger } from "./logger";

export function startScheduler(): void {
  // ── Every minute during market hours — check if any target was hit ──────────
  cron.schedule(
    "* * * * *",
    async () => {
      try {
        await checkTargetsNow();
      } catch (err) {
        logger.error({ err }, "Scheduler: target check failed");
      }
    },
    { timezone: "Asia/Kolkata" }
  );

  // ── 3:30 PM IST every weekday — auto-close all remaining active picks ───────
  cron.schedule(
    "30 15 * * 1-5",
    async () => {
      logger.info("Scheduler: 3:30 PM IST — running auto P&L");
      try {
        await runAutoPnl();
      } catch (err) {
        logger.error({ err }, "Scheduler: auto P&L failed");
      }
    },
    { timezone: "Asia/Kolkata" }
  );

  logger.info("Scheduler: real-time target monitor (every 1 min) + auto P&L at 3:30 PM IST registered");
}
