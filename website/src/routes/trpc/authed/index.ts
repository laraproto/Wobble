import { authedProcedure, router } from "#modules/trpc";
import { z } from "zod";
import * as arctic from "arctic";
import { discord, discordScopes } from "#modules/oauth";
import currentUserRouter from "./currentUser";

const authedRouter = router({
  currentUser: currentUserRouter,
  makeInvite: authedProcedure.query(({ ctx }) => {
    if (!discord) {
      return { success: false, message: "Complete installer first" };
    }

    const state = arctic.generateState();
    const url = discord.createAuthorizationURL(state, null, [
      ...discordScopes,
      "bot",
    ]);

    /* Incomplete no way to store state right now as cookies are not exposed to trpc,
    will get back to working on it later
    */
  }),
});

export default authedRouter;
