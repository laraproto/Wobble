import { authedProcedure, router } from "#modules/trpc";
import * as auth from "#modules/auth";
import { z } from "zod";

const currentUserRouter = router({
  me: authedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),
  logout: authedProcedure.mutation(async ({ ctx }) => {
    return await auth.invalidateSession(ctx.session.id);
  }),
});

export default currentUserRouter;
