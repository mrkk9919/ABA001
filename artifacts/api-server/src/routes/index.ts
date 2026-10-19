import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bakongRouter from "./bakong";
import paywayRouter from "./payway";
import khmerTtsRouter from "./khmer-tts";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/bakong", bakongRouter);
router.use("/payway", paywayRouter);
router.use(khmerTtsRouter);

export default router;
