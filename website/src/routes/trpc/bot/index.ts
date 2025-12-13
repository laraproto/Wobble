import { botProcedure, router } from "#modules/trpc";
import z from "zod";
import { guildInsertSchema } from "#modules/db/schema.ts";
import { db, schema } from "#modules/db/index.ts";
import { zodSnowflake } from "#/types/discord";
import { eq } from "drizzle-orm";

const botRouter = router({
  addGuild: botProcedure
    .input(guildInsertSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const newGuild = await db
          .insert(schema.guild)
          .values({
            guildId: input.guildId,
            name: input.name,
            ownerId: input.ownerId,
            iconHash: input.iconHash,
            bannnerHash: input.bannnerHash,
          })
          .returning();

        if (!newGuild[0]) {
          return {
            success: false,
            message: "Failed to add guild",
          };
        }

        return {
          success: true,
          guild: newGuild[0],
        };
      } catch (err) {
        return {
          success: false,
          message: `DB Insert Failed: ${(err as Error).message}`,
        };
      }
    }),
  checkGuild: botProcedure.input(zodSnowflake).query(async ({ ctx, input }) => {
    const guild = await db.query.guild.findFirst({
      where: (guild, { eq }) => eq(guild.guildId, input),
    });

    if (guild) {
      return {
        success: true,
        guild,
      };
    }

    return {
      success: false,
      message: "Guild not found",
      guild: null,
    };
  }),
  removeGuild: botProcedure
    .input(zodSnowflake)
    .mutation(async ({ ctx, input }) => {
      const deleteResult = await db
        .delete(schema.guild)
        .where(eq(schema.guild.guildId, input))
        .returning();

      if (deleteResult.length === 0) {
        return {
          success: false,
          message: "Guild not found or already deleted",
        };
      }

      return {
        success: true,
        message: "Guild successfully removed",
        guild: deleteResult[0],
      };
    }),
});

export default botRouter;
