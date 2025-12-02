import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { installerConfig } from "#modules/installer";
import type { Session, UserMinimal } from "../db/schema";

interface TRPCContext {
  session: Session;
  user: UserMinimal;
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
