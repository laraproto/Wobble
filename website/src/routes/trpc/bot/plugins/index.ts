import { router } from "#modules/trpc";
import counterRouter from "./counter";
import casesRouter from "./cases";

const pluginsRouter = router({
  counters: counterRouter,
  cases: casesRouter,
});

export default pluginsRouter;
