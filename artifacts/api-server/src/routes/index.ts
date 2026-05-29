import { Router, type IRouter } from "express";
import healthRouter from "./health";
import crawlsRouter from "./crawls";
import todosRouter from "./todos";
import reportsRouter from "./reports";
import keywordsRouter from "./keywords";
import leadsRouter from "./leads";
import backlinksRouter from "./backlinks";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(crawlsRouter);
router.use(todosRouter);
router.use(reportsRouter);
router.use(keywordsRouter);
router.use(leadsRouter);
router.use(backlinksRouter);
router.use(dashboardRouter);

export default router;
