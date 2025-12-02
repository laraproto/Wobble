import { authedProcedure, router } from "#modules/trpc";
import { z } from "zod";
import currentUserRouter from "./currentUser";

const authedRouter = router({
  currentUser: currentUserRouter,
});

export default authedRouter;
