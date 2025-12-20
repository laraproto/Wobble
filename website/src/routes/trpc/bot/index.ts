import { botProcedure, router } from "#modules/trpc";
import { guildInsertSchema } from "#modules/db/schema.ts";
import { db, schema } from "#modules/db/index.ts";
import { zodSnowflake } from "#/types/discord";
import { eq } from "drizzle-orm";
import pluginsRouter from "./plugins";

const botRouter = router({
  addGuild: botProcedure
    .input(guildInsertSchema)
    .mutation(async ({ input }) => {
      try {
        const newGuild = await db
          .insert(schema.guild)
          .values({
            guildId: input.guildId,
            name: input.name,
            ownerId: input.ownerId,
            iconHash: input.iconHash,
            bannerHash: input.bannerHash,
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
        console.error("Error creating guild:", err);
        return {
          success: false,
          message: `DB Insert Failed: ${(err as Error).message}`,
        };
      }
    }),
  checkGuild: botProcedure.input(zodSnowflake).query(async ({ input }) => {
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
  updateGuild: botProcedure
    .input(guildInsertSchema)
    .mutation(async ({ input }) => {
      try {
        const updateResult = await db
          .update(schema.guild)
          .set({
            name: input.name,
            ownerId: input.ownerId,
            iconHash: input.iconHash,
            bannerHash: input.bannerHash,
          })
          .where(eq(schema.guild.guildId, input.guildId))
          .returning();

        if (updateResult.length === 0) {
          return {
            success: false,
            message: "Guild not found",
          };
        }

        return {
          success: true,
          message: "Guild updated",
          guild: updateResult[0],
        };
      } catch (err) {
        console.error("Error updating guild:", err);
        return {
          success: false,
          message: `DB update failed: ${(err as Error).message}`,
        };
      }
    }),
  removeGuild: botProcedure.input(zodSnowflake).mutation(async ({ input }) => {
    try {
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
    } catch (err) {
      console.error("Error deleting guild:", err);
      return {
        success: false,
        message: `DB update failed: ${(err as Error).message}`,
      };
    }
  }),
  plugins: pluginsRouter,
});

export default botRouter;
