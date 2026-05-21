import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import recommendationsRouter from "./recommendations";
import analyticsRouter from "./analytics";
import adminRouter from "./admin";
import paymentsRouter from "./payments";
import notificationsRouter from "./notifications";
import subscriptionsRouter from "./subscriptions";
import referralsRouter from "./referrals";
import quotesRouter from "./quotes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(recommendationsRouter);
router.use(analyticsRouter);
router.use(adminRouter);
router.use(paymentsRouter);
router.use(notificationsRouter);
router.use(subscriptionsRouter);
router.use(referralsRouter);
router.use(quotesRouter);

export default router;
