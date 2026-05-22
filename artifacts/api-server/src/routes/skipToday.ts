import { Router, type IRouter } from "express";
import { db, userSkipsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { todayIST } from "../ist";

const router: IRouter = Router();

router.get("/recommendations/skip-today", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const today = todayIST();

  const [skip] = await db
    .select()
    .from(userSkipsTable)
    .where(and(eq(userSkipsTable.userId, userId), eq(userSkipsTable.skipDate, today)));

  res.json({ skipped: !!skip, date: today });
});

router.post("/recommendations/skip-today", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const today = todayIST();

  const [existing] = await db
    .select()
    .from(userSkipsTable)
    .where(and(eq(userSkipsTable.userId, userId), eq(userSkipsTable.skipDate, today)));

  if (existing) {
    await db
      .delete(userSkipsTable)
      .where(and(eq(userSkipsTable.userId, userId), eq(userSkipsTable.skipDate, today)));
    res.json({ skipped: false, date: today });
  } else {
    await db.insert(userSkipsTable).values({ userId, skipDate: today });
    res.json({ skipped: true, date: today });
  }
});

export default router;
