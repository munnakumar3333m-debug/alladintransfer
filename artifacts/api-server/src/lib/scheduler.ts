import cron from "node-cron";
import { runAutoPnl } from "./autoPnl";
import { logger } from "./logger";

export function startScheduler(): void {
  // 3:30 PM IST every weekday (Mon–Fri)
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

  logger.info("Scheduler: auto P&L job registered (3:30 PM IST, Mon–Fri)");
}
