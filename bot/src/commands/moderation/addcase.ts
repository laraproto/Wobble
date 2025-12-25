import { type BotCommand } from "#botBase";
import { SlashCommandBuilder } from "discord.js";
import { type BaseModActionsSchema } from "#/types/modules";
import { createCase, type CasesCreateInput } from "#botModules/cases";

export default {
  data: new SlashCommandBuilder()
    .setName("addcase")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The member to add a case to")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Case type")
        .setRequired(true)
        .addChoices(
          { name: "Note", value: "note" },
          { name: "Warn", value: "warn" },
          { name: "Mute", value: "mute" },
          { name: "Unmute", value: "unmute" },
          { name: "Kick", value: "kick" },
          { name: "Ban", value: "ban" },
          { name: "Softban", value: "softban" },
          { name: "Unban", value: "unban" },
          { name: "Unmute", value: "unmute" },
        ),
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("The reason for the case"),
    )
    .setDescription("Adds a case to a user"),
  requiredPlugin: "modActions",
  guildOnly: true,
  async canExecute(plugin?: BaseModActionsSchema) {
    if (!plugin) return [false, "Plugin is not configured"];
    if (!plugin.can_addcase)
      return [
        false,
        "You do not meet the level conditions for adding cases or adding cases is disabled",
      ];
    return [true, ""];
  },
  async execute(interaction) {
    const target = interaction.options.getUser("target", true);
    const caseType = interaction.options.getString(
      "type",
      true,
    ) as CasesCreateInput["caseType"];
    const reason =
      interaction.options.getString("reason") ?? "No reason provided";

    await createCase(
      {
        caseType,
        guildId: interaction.guild!.id,
        creatorId: interaction.user.id,
        targetId: target.id,
        reason,
      },
      false,
    );

    await interaction.reply({
      content: `Added a case of type ${caseType} to ${target.tag}`,
    });
  },
} as BotCommand;
