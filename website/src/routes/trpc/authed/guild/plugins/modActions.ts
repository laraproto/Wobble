import { z } from "zod";
import {
  botConfigSchema,
  modActionsSchema,
  operationParsingRegex,
} from "#/types/modules";
import { guildProcedure, router } from "#modules/trpc";
import { applyGuildSettings } from "#modules/guild/index.ts";

const modActionsConfigFormSchema = z.object({
  dm_on_warn: z.boolean(),
  dm_on_kick: z.boolean(),
  dm_on_ban: z.boolean(),
  warn_message: z.string().max(2000),
  kick_message: z.string().max(2000),
  ban_message: z.string().max(2000),
  tempban_message: z.string().max(2000),
  can_note: z.boolean(),
  can_warn: z.boolean(),
  can_mute: z.boolean(),
  can_kick: z.boolean(),
  can_ban: z.boolean(),
  can_unban: z.boolean(),
  can_view: z.boolean(),
  can_addcase: z.boolean(),
  can_massunban: z.boolean(),
  can_massban: z.boolean(),
  can_massmute: z.boolean(),
  can_hidecase: z.boolean(),
  can_deletecase: z.boolean(),
});

const modActionsFormSchema = z.object({
  config: modActionsConfigFormSchema,
  overrides: z.array(
    z.object({
      level: z.string().regex(operationParsingRegex),
      config: modActionsConfigFormSchema,
    }),
  ),
});

const guildModActionsRouter = router({
  get: guildProcedure.query(async ({ ctx }) => {
    const modActionsPlugin = ctx.guild.settings.plugins.modActions;
    return modActionsPlugin || modActionsSchema.parse({});
  }),
  set: guildProcedure
    .input(modActionsFormSchema)
    .mutation(async ({ ctx, input }) => {
      const updatedModActions = await modActionsSchema.safeParseAsync(input);

      if (!updatedModActions.success) {
        return {
          success: false,
          message: "Invalid mod actions configuration",
          error: z.treeifyError(updatedModActions.error),
        };
      }

      const botConfigParse = await botConfigSchema.safeParseAsync({
        ...ctx.guild.settings,
        plugins: {
          ...ctx.guild.settings.plugins,
          modActions: updatedModActions.data,
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
        message: "Mod actions configuration updated successfully",
        data: updatedModActions.data?.config,
      };
    }),
});

export default guildModActionsRouter;
