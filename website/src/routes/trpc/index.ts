import { installerConfig } from "#modules/installer";
import { publicProcedure, router } from "#modules/trpc";
import { z } from "zod";
import installerRouter from "./installer";
import authedRouter from "./authed";

export const appRouter = router({
  hello: publicProcedure
    .input(
      z.object({
        name: z.string().nullish(),
      }),
    )
    .output(z.string())
    .query(({ input, ctx }) => {
      return `Hello, ${input?.name ?? "world"}! ${!ctx.isBot ? `Your session is ${JSON.stringify(ctx.session)}` : `You are a bot user`}`;
    }),
  configuration: publicProcedure.query(() => {
    return {
      installed: !!installerConfig,
      url: installerConfig?.url,
    };
  }),
  installer: installerRouter,
  authed: authedRouter,
});

export type AppRouter = typeof appRouter;
