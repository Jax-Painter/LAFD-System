import { Router, type IRouter } from "express";
import healthRouter from "./health";
import discordRouter from "./discord";
import botConfigRouter from "./botconfig";

const router: IRouter = Router();

router.use(healthRouter);
router.use(discordRouter);
router.use(botConfigRouter);

export default router;
