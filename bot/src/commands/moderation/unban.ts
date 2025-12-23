import { type BotCommand } from "#botBase";
import { SlashCommandBuilder, MessageFlags, DiscordAPIError } from "discord.js";
import { type BaseModActionsSchema } from "#/types/modules";
import { createCase } from "#botModules/cases";
import trpc from "#botModules/trpc";

export default {
  data: new SlashCommandBuilder()
    .setName("unban")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The member to unban")
        .setRequired(true),
    )
    .setDescription("Unbans a user from the server"),
  requiredPlugin: "modActions",
  guildOnly: true,
  async canExecute(plugin?: BaseModActionsSchema) {
    if (!plugin) return [false, "Plugin is not configured"];
    if (!plugin.can_unban)
      return [
        false,
        "You do not meet the level conditions for unbanning or unbanning is disabled",
      ];
    return [true, ""];
  },
  async execute(interaction) {
    const target = interaction.options.getUser("target", true);

    const getGuild = await trpc.bot.checkGuild.query(interaction.guild!.id);
    if (!getGuild.success) {
      interaction.reply({
        content: "I do not know what this guild is.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const alreadyBanned = await trpc.bot.plugins.modActions.checkBan.query({
      guildId: getGuild.guild!.uuid,
      targetId: target.id,
    });

    if (!alreadyBanned.ban) {
      interaction.reply({
        content: `${target.tag} is not banned from this server.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const unbanCase = await createCase({
      caseType: "unban",
      guildId: interaction.guild!.id,
      creatorId: interaction.user.id,
      targetId: target.id,
      reason: `(UNBAN) ${alreadyBanned.ban.reason}`,
    });

    if (!unbanCase || !unbanCase.data) {
      await interaction.reply({
        content: "Failed to create unban case.",
        flags: MessageFlags.Ephemeral,
      });
    }

    setTimeout(async () => {
      try {
        await interaction.guild!.members.unban(
          target,
          `Unbanned by ${interaction.user.tag}`,
        );
      } catch (err) {
        const apiError = err as DiscordAPIError;
        if (apiError.code === 10007) {
          // Unknown Member
          await interaction.reply({
            content: `User is not in this server`,
          });
          return;
        }
      }
    }, 3000);

    await trpc.bot.plugins.modActions.deleteBan.mutate({
      guildId: getGuild.guild!.uuid,
      targetId: target.id,
    });

    await interaction.reply({
      content: `Unbanned ${target.tag} from the server`,
    });
  },
} as BotCommand;
