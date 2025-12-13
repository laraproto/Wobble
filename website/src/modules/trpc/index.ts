import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { installerConfig } from "#modules/installer";
import { db } from "../db";
import type { Session, UserMinimal, User } from "../db/schema";
import z from "zod";

interface TRPCContext {
  session: Session;
  user: UserMinimal;
  userUnredacted: User;
  isBot: boolean;
  setStateCookie: (state: string) => void;
  getStateCookie: () => string | undefined;
}

interface Meta {}

const t = initTRPC.context<TRPCContext>().meta<Meta>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const installerProcedure = publicProcedure.use(async (opts) => {
  const { ctx } = opts;
  if (installerConfig) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  return opts.next({
    ctx,
  });
});

export const authedProcedure = publicProcedure.use(async (opts) => {
  const { ctx } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return opts.next({
    ctx,
  });
});

export const botProcedure = publicProcedure.use(async (opts) => {
  const { ctx } = opts;

  if (!ctx.isBot) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return opts.next({
    ctx,
  });
});

export const guildProcedure = authedProcedure
  .input(
    z.object({
      guildId: z.string(),
    }),
  )
  .use(async (opts) => {
    const { ctx, input } = opts;

    // eventually people will be allowed to get given panel access but right now it's only the owner
    const guildQuery = await db.query.guild.findFirst({
      where: (guild, { eq }) => eq(guild.guildId, input.guildId),
    });

    if (!guildQuery) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    if (guildQuery.ownerId !== ctx.user.discordId) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    return opts.next({
      ctx: {
        ...ctx,
        guild: guildQuery,
      },
    });
  });
