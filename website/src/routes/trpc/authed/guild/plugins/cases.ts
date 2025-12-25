import { z } from "zod";
import { zodSnowflake } from "#/types/discord";
import { botConfigSchema, casesSchema } from "#/types/modules";
import { guildProcedure, router } from "#modules/trpc";
import { applyGuildSettings } from "#modules/guild/index.ts";

const casesFormSchema = z.object({
  logAutomaticActions: z.boolean(),
  casesChannel: zodSnowflake,
  caseColors: z.object({
    ban: z.string(),
    unban: z.string(),
    note: z.string(),
    warn: z.string(),
    kick: z.string(),
    mute: z.string(),
    unmute: z.string(),
    deleted: z.string(),
    softban: z.string(),
  }),
  caseIcons: z.object({
    ban: z.string(),
    unban: z.string(),
    note: z.string(),
    warn: z.string(),
    kick: z.string(),
    mute: z.string(),
    unmute: z.string(),
    deleted: z.string(),
    softban: z.string(),
  }),
});

const guildCasesRouter = router({
  get: guildProcedure.query(async ({ ctx }) => {
    const casesPlugin = ctx.guild.settings.plugins.cases;
    return casesPlugin || casesSchema.parse({});
  }),
  set: guildProcedure
    .input(casesFormSchema)
    .mutation(async ({ ctx, input }) => {
      const updatedCases = await casesSchema.safeParseAsync({
        config: input,
      });

      if (!updatedCases.success) {
        return {
          success: false,
          message: "Invalid cases configuration",
          error: z.treeifyError(updatedCases.error),
        };
      }

      const botConfigParse = await botConfigSchema.safeParseAsync({
        ...ctx.guild.settings,
        plugins: {
          ...ctx.guild.settings.plugins,
          cases: updatedCases.data,
        },
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
        message: "Cases configuration updated successfully",
        data: updatedCases.data?.config,
      };
    }),
});

export default guildCasesRouter;
