import { publicProcedure, authedProcedure, router } from "#modules/trpc";
import * as auth from "#modules/auth";
import { z } from "zod";
import { discordKy } from "#/kyInstance";
import {
  PermissionFlagsBits,
  type APIPartialGuild,
} from "discord-api-types/v10";

const currentUserRouter = router({
  me: publicProcedure.query(async ({ ctx }) => {
    return ctx.user || null;
  }),
  logout: authedProcedure.mutation(async ({ ctx }) => {
    return await auth.invalidateSession(ctx.session.id);
  }),
  getGuilds: authedProcedure.query(async ({ ctx }) => {
    const userGuilds = await discordKy
      .get("users/@me/guilds", {
        headers: {
          Authorization: `Bearer ${ctx.userUnredacted.accessToken}`,
        },
      })
      .json<
        APIPartialGuild &
          {
            permissions: number;
            owner: boolean;
          }[]
      >();

    let guilds: {
      id: string;
      name: string;
      permissions: number;
      icon: string | null;
      banner: string | null;
    }[] = [];
    return userGuilds;
  }),
});

export default currentUserRouter;
