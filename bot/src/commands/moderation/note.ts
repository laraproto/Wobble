import { type BotCommand } from "#botBase";
import { SlashCommandBuilder } from "discord.js";
import { type BaseModActionsSchema } from "#/types/modules";
import { createCase } from "#botModules/cases";

export default {
  data: new SlashCommandBuilder()
    .setName("note")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The member to note")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("The reason for note"),
    )
    .setDescription("Adds a note to a user"),
  requiredPlugin: "modActions",
  guildOnly: true,
  async canExecute(plugin?: BaseModActionsSchema) {
    if (!plugin) return [false, "Plugin is not configured"];
    if (!plugin.can_note)
      return [
        false,
        "You do not meet the level conditions for noting or noting is disabled",
      ];
    return [true, ""];
  },
  async execute(interaction) {
    const target = interaction.options.getUser("target", true);
    const reason =
      interaction.options.getString("reason") ?? "No reason provided";

    await createCase(
      {
        caseType: "note",
        guildId: interaction.guild!.id,
        creatorId: interaction.user.id,
        targetId: target.id,
        reason,
      },
      false,
    );

    await interaction.reply({
      content: `Added a note to ${target.tag}`,
    });
  },
} as BotCommand;
