import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { installerConfig } from "@modules/installer";

interface TRPCContext {}

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
