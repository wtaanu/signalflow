import { Router, type IRouter } from "express";
import healthRouter from "./health";
import leadsRouter from "./leads";
import authRouter from "./auth";
import plansRouter from "./plans";
import billingRouter from "./billing";
import extensionRouter from "./extension";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(leadsRouter);
router.use(plansRouter);
router.use(billingRouter);
router.use(extensionRouter);

export default router;
