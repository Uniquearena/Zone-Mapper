import { Router, type IRouter } from "express";
import healthRouter from "./health";
import deadzonesRouter from "./deadzones";
import statsRouter from "./stats";
import clustersRouter from "./clusters";
import routingRouter from "./routing";

const router: IRouter = Router();

router.use(healthRouter);
router.use(deadzonesRouter);
router.use(statsRouter);
router.use(clustersRouter);
router.use(routingRouter);

export default router;
