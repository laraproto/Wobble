import { z } from "zod";
import { durationParsingRegex, operationParsingRegex } from "#/types/modules";
import { botConfigSchema } from "#/types/modules";
import { guildProcedure, router } from "#modules/trpc";
import { applyGuildSettings } from "#modules/guild/index.ts";

const countersFormSchema = z.object({
  counters: z.array(
    z.object({
      name: z.string(),
      counter: z.object({
        per_channel: z.boolean().default(false),
        per_user: z.boolean().default(false),
        initial_value: z.number().default(0),
        decay: z
          .object({
            amount: z.number().min(1).default(1),
            interval: z.string().regex(durationParsingRegex),
          })
          .optional(), // Tanstack form doesn't like optional stuff, i need to change this too
        triggers: z.array(
          z.object({
            name: z.string(),
            data: z.object({
              condition: z.string().regex(operationParsingRegex),
            }),
          }),
        ),
      }),
    }),
  ),
});

const guildCountersRouter = router({
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

export default guildCountersRouter;
