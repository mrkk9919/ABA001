import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bakongRouter from "./bakong";
import paywayRouter from "./payway";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/bakong", bakongRouter);
router.use("/payway", paywayRouter);

export default router;
