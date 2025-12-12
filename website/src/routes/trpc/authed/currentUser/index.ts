import { publicProcedure, authedProcedure, router } from "#modules/trpc";
import * as auth from "#modules/auth";
import { z } from "zod";
import { db } from "#/modules/db";
import { discordKy } from "#/kyInstance";
import {
  PermissionFlagsBits,
  type APIPartialGuild,
} from "discord-api-types/v10";

interface GuildWithPermissions extends APIPartialGuild {
  permissions: number;
  owner: boolean;
}

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
      .json<GuildWithPermissions[]>();

    const addedGuilds = await db.query.guild.findMany({
      where: (guild, { eq }) => eq(guild.ownerId, ctx.user.discordId),
    });

    let guilds: {
      id: string;
      name: string;
      permissions: number;
      icon: string | null;
      banner: string | null | undefined;
      owner: boolean;
      inviteable: boolean;
      uuid: string | null;
    }[] = [];

    for (const guild of userGuilds) {
      if (
        !!(BigInt(guild.permissions) & PermissionFlagsBits.ManageGuild) ||
        guild.owner
      ) {
        // Might actually be faster to do a sql query for each instead of loop in a loop
        const localisedGuild = addedGuilds.find((g) => g.guildId === guild.id);
        guilds.push({
          id: guild.id,
          name: guild.name,
          permissions: guild.permissions,
          icon: guild.icon,
          banner: guild.banner,
          owner: guild.owner,
          inviteable: !localisedGuild,
          uuid: localisedGuild?.uuid || null,
        });
        continue;
      }
    }

    return guilds;
  }),
});

export default currentUserRouter;
