import z from "zod";
import { router, botProcedure } from "#modules/trpc";
import { zodSnowflake } from "#/types/discord";
import { db, schema } from "#modules/db/index.ts";
import { eq, and } from "drizzle-orm";

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
      const guild = await db.query.guild.findFirst({
        where: eq(schema.guild.guildId, input.guildId),
      });

      if (!guild) {
        return {
          success: false,
          message: "Guild not found in database",
        };
      }

      const counter = await db.query.guildCounters.findFirst({
        where: and(
          eq(schema.guildCounters.guildId, guild.uuid),
          eq(schema.guildCounters.counterName, input.counterName),
        ),
      });

      if (!counter) {
        return {
          success: false,
          message: "Counter not found",
        };
      }

      if (counter.perUser && !input.user_id) {
        return {
          success: false,
          message: "This counter is per-user, but no user_id was provided",
        };
      }

      if (counter.perChannel && !input.channel_id) {
        return {
          success: false,
          message:
            "This counter is per-channel, but no channel_id was provided",
        };
      }

      if (counter.perUser && input.user_id) {
        const existingEntry = await db.query.guildCounterValues.findFirst({
          where: and(
            eq(schema.guildCounterValues.counterId, counter.uuid),
            eq(schema.guildCounterValues.userId, input.user_id),
          ),
        });

        if (existingEntry) {
          await db
            .update(schema.guildCounterValues)
            .set({
              value: existingEntry.value + input.value,
            })
            .where(
              and(
                eq(schema.guildCounterValues.counterId, counter.uuid),
                eq(schema.guildCounterValues.userId, input.user_id),
              ),
            );
        } else {
          await db.insert(schema.guildCounterValues).values({
            counterId: counter.uuid,
            userId: input.user_id,
            value: counter.initialValue + input.value,
          });
        }
      } else if (counter.perChannel && input.channel_id) {
        const existingEntry = await db.query.guildCounterValues.findFirst({
          where: and(
            eq(schema.guildCounterValues.counterId, counter.uuid),
            eq(schema.guildCounterValues.channelId, input.channel_id),
          ),
        });

        if (existingEntry) {
          await db
            .update(schema.guildCounterValues)
            .set({
              value: existingEntry.value + input.value,
            })
            .where(
              and(
                eq(schema.guildCounterValues.counterId, counter.uuid),
                eq(schema.guildCounterValues.channelId, input.channel_id),
              ),
            );
        } else {
          await db.insert(schema.guildCounterValues).values({
            counterId: counter.uuid,
            channelId: input.channel_id,
            value: counter.initialValue + input.value,
          });
        }
      }
    }),
});

export default counterRouter;
