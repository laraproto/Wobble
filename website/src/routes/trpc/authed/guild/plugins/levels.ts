import { z } from "zod";
import { zodSnowflake } from "#/types/discord";
import { botConfigSchema } from "#/types/modules";
import { guildProcedure, router } from "#modules/trpc";
import { applyGuildSettings } from "#modules/guild/index.ts";

const levelFormSchema = z.object({
  levels: z.array(
    z.object({
      id: zodSnowflake,
      level: z.number().min(0).max(100),
    }),
  ),
});

const guildLevelsRouter = router({
  get: guildProcedure.query(async ({ ctx }) => {
    const levelsPlugin = ctx.guild.settings.levels;
    const levelsArray = Object.entries(levelsPlugin || {}).map(
      ([id, level]) => ({
        id,
        level,
      }),
    );
    return levelsArray;
  }),
  set: guildProcedure
    .input(levelFormSchema)
    .mutation(async ({ ctx, input }) => {
      const updatedLevels: { [k: string]: number } = {};

      for (const level of input.levels) {
        updatedLevels[level.id] = level.level;
      }

      const botConfigParse = await botConfigSchema.safeParseAsync({
        ...ctx.guild.settings,
        levels: updatedLevels,
      });

      if (!botConfigParse.success) {
        return {
          success: false,
          message: "Failed to update guild configuration",
          error: z.treeifyError(botConfigParse.error),
        };
      }

      await applyGuildSettings(ctx.guild!.guildId, botConfigParse.data);

      return {
        success: true,
        message: "Levels configuration updated successfully",
        data: input.levels,
      };
    }),
});

export default guildLevelsRouter;
