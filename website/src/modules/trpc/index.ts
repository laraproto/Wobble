import { initTRPC } from "@trpc/server";
import superjson from "superjson";

interface TRPCContext {}

interface Meta {}

const t = initTRPC.context<TRPCContext>().meta<Meta>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
