import { router } from "#modules/trpc";
import counterRouter from "./counter";
import casesRouter from "./cases";
import modActionsRouter from "./modActions";

const pluginsRouter = router({
  counters: counterRouter,
  cases: casesRouter,
  modActions: modActionsRouter,
});

export default pluginsRouter;
