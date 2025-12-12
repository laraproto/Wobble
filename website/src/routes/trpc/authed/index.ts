import { authedProcedure, router } from "#modules/trpc";
import * as arctic from "arctic";
import { discord, discordScopes } from "#modules/oauth";
import currentUserRouter from "./currentUser";
import { zodSnowflake } from "#/types/discord";

const authedRouter = router({
  currentUser: currentUserRouter,
  makeInvite: authedProcedure.input(zodSnowflake).mutation(({ ctx, input }) => {
    if (!discord) {
      return { success: false, message: "Complete installer first" };
    }

    try {
      const state = arctic.generateState();
      const url = discord.createAuthorizationURL(state, null, [
        ...discordScopes,
        "bot",
      ]);

      ctx.setStateCookie(state);

      // Temporary, will fine tune permissions, eventually
      url.searchParams.append("permissions", "8");

      url.searchParams.append("guild_id", input);

      return { success: true, url: url.href };
    } catch (err) {
      console.error("Error creating invite link:", err);
      return { success: false, message: "Failed to create invite link" };
    }
  }),
});

export default authedRouter;
