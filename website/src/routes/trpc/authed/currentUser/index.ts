import { authedProcedure, router } from "#modules/trpc";
import { z } from "zod";

const currentUserRouter = router({
  me: authedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),
});

export default currentUserRouter;
