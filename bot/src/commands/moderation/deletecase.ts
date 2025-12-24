import { type BotCommand } from "#botBase";
import { SlashCommandBuilder } from "discord.js";
import { type BaseModActionsSchema } from "#/types/modules";
import trpc from "#botModules/trpc";
//import { createCase } from "#botModules/cases";

export default {
  data: new SlashCommandBuilder()
    .setName("deletecase")
    .addStringOption((option) =>
      option
        .setName("case")
        .setDescription("The case to delete (case ID)")
        .setRequired(true),
    )
    .setDescription("Deletes a case"),
  requiredPlugin: "modActions",
  guildOnly: true,
  async canExecute(plugin?: BaseModActionsSchema) {
    if (!plugin) return [false, "Plugin is not configured"];
    if (!plugin.can_addcase)
      // No edit permission lmao, i cba to add a new one
      return [
        false,
        "You do not meet the level conditions for editing cases or editing is disabled",
      ];
    return [true, ""];
  },
  async execute(interaction) {
    const caseId = interaction.options.getString("case", true);

    const guildInfo = await trpc.bot.checkGuild.query(interaction.guild!.id);

    if (!guildInfo || !guildInfo.guild) {
      await interaction.reply({
        content: "I do not know what this guild is",
      });
      return;
    }

    const caseDelete = await trpc.bot.plugins.cases.deleteCase.mutate({
      guildId: guildInfo.guild!.uuid,
      caseId,
    });

    if (!caseDelete.success) {
      await interaction.reply({
        content: `Failed to delete case: ${caseDelete.message}`,
      });
      return;
    }

    //I need to add support for deleted cases in the create case function

    await interaction.reply({
      content: `Case ${caseId} deleted`,
    });
  },
} as BotCommand;
