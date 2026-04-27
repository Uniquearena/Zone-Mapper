import { Router, type IRouter } from "express";
import healthRouter from "./health";
import deadzonesRouter from "./deadzones";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(deadzonesRouter);
router.use(statsRouter);

export default router;
