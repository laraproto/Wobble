import z from "zod";
import { router, botProcedure } from "#modules/trpc";
import { zodSnowflake } from "#/types/discord";

const counterRouter = router({
  incrementCounter: botProcedure
    .input(
      z.object({
        guildId: zodSnowflake,
        counterName: z.string().min(1).max(100),
        value: z.int().default(1),
        channel_id: zodSnowflake.optional(),
        user_id: zodSnowflake.optional(),
      }),
    )
    .mutation(async ({ input }) => {
      console.log(input);
    }),
});

export default counterRouter;
