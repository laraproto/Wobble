import { publicProcedure, authedProcedure, router } from "#modules/trpc";
import * as auth from "#modules/auth";
import { z } from "zod";

const currentUserRouter = router({
  me: publicProcedure.query(async ({ ctx }) => {
    return ctx.user || null;
  }),
  logout: authedProcedure.mutation(async ({ ctx }) => {
    return await auth.invalidateSession(ctx.session.id);
  }),
});

export default currentUserRouter;
