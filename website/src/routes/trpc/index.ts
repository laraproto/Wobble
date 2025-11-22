import { installerConfig } from "@/modules/installer";
import { publicProcedure, router } from "@modules/trpc";
import { z } from "zod";

export const appRouter = router({
  hello: publicProcedure
    .input(
      z.object({
        name: z.string().nullish(),
      }),
    )
    .output(z.string())
    .query(({ input }) => {
      return `Hello, ${input?.name ?? "world"}!`;
    }),
  configuration: publicProcedure.query(() => {
    return {
      installed: !!installerConfig,
      url: installerConfig?.url,
    };
  }),
});

export type AppRouter = typeof appRouter;
