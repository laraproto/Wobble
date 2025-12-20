import { router } from "#modules/trpc";
import counterRouter from "./counter";

const pluginsRouter = router({
  counters: counterRouter,
});

export default pluginsRouter;
