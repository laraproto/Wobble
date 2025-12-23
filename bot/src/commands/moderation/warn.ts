import { type BotCommand } from "#botBase";
import { SlashCommandBuilder } from "discord.js";
import { type BaseModActionsSchema } from "#/types/modules";
import { createCase } from "#botModules/cases";

export default {
  data: new SlashCommandBuilder()
    .setName("warn")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The member to warn")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("The reason for warn"),
    )
    .setDescription("Warns a user in the server"),
  requiredPlugin: "modActions",
  guildOnly: true,
  async canExecute(plugin?: BaseModActionsSchema) {
    if (!plugin) return [false, "Plugin is not configured"];
    if (!plugin.can_warn)
      return [
        false,
        "You do not meet the level conditions for warning or warning is disabled",
      ];
    return [true, ""];
  },
  async execute(interaction) {
    const target = interaction.options.getUser("target", true);
    const reason =
      interaction.options.getString("reason") ?? "No reason provided";

    await createCase({
      caseType: "warn",
      guildId: interaction.guild!.id,
      creatorId: interaction.user.id,
      targetId: target.id,
      reason,
    });

    await interaction.reply({
      content: `Warned ${target.tag} in the server`,
    });
  },
} as BotCommand;
