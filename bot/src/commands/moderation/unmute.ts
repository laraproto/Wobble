import { type BotCommand } from "#botBase";
import { MessageFlags, SlashCommandBuilder, GuildMember } from "discord.js";
import { type BaseModActionsSchema } from "#/types/modules";
import { createCase } from "#botModules/cases";

export default {
  data: new SlashCommandBuilder()
    .setName("unmute")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The member to unmute")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("The reason for unmute"),
    )
    .setDescription("Unmutes a user"),
  requiredPlugin: "modActions",
  guildOnly: true,
  async canExecute(plugin?: BaseModActionsSchema) {
    if (!plugin) return [false, "Plugin is not configured"];
    if (!plugin.can_mute)
      return [
        false,
        "You do not meet the level conditions for muting or muting is disabled",
      ];
    return [true, ""];
  },
  async execute(interaction) {
    const target = interaction.options.getMember("target");
    const reason =
      interaction.options.getString("reason") ?? "No reason provided";

    if (!target) {
      await interaction.reply({
        content: "The specified user is not a member of this server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!(target instanceof GuildMember)) {
      await interaction.reply({
        content: "The specified user is not a valid member.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await createCase(
      {
        caseType: "unmute",
        guildId: interaction.guild!.id,
        creatorId: interaction.user.id,
        targetId: target.id,
        reason,
      },
      false,
    );

    await target.timeout(null, reason);

    await interaction.reply({
      content: `Unmuted ${target.user.tag}`,
    });
  },
} as BotCommand;
