import { type BotCommand } from "#botBase";
import { MessageFlags, SlashCommandBuilder, GuildMember } from "discord.js";
import { type BaseModActionsSchema } from "#/types/modules";
import { createCase } from "#botModules/cases";
import { makeDuration } from "@wobble/website/configParser";

export default {
  data: new SlashCommandBuilder()
    .setName("mute")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The member to mute")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("duration")
        .setDescription("How long to mute for, ex: 10m")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("The reason for mute"),
    )
    .setDescription("Mutes a user"),
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
    const duration = await makeDuration(
      interaction.options.getString("duration", true),
    );
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

    if (!duration.isValid()) {
      await interaction.reply({
        content: "The provided duration is invalid.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await createCase(
      {
        caseType: "mute",
        guildId: interaction.guild!.id,
        creatorId: interaction.user.id,
        targetId: target.id,
        reason,
      },
      false,
    );

    await target.timeout(duration.asMilliseconds(), reason);

    await interaction.reply({
      content: `Muted ${target.user.tag} for ${duration.humanize()}`,
    });
  },
} as BotCommand;
