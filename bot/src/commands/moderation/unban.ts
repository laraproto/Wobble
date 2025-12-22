import { type BotCommand } from "#botBase";
import { SlashCommandBuilder, MessageFlags, DiscordAPIError } from "discord.js";
import { type BaseModActionsSchema } from "#/types/modules";
import handlebars from "handlebars";
import { createCase, type CasesCreateOutput } from "#botModules/cases";
import { makeDuration } from "@wobble/website/configParser";
import trpc from "#botModules/trpc";

export default {
  data: new SlashCommandBuilder()
    .setName("unban")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The member to ban")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("duration").setDescription("Duration of the ban, ex: 1d"),
    )
    .addStringOption((option) =>
      option
        .setName("delete")
        .setDescription("Message history to delete, ex: 1h"),
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("The reason for ban"),
    )
    .setDescription("Kicks a user from the server"),
  requiredPlugin: "modActions",
  guildOnly: true,
  async canExecute(plugin?: BaseModActionsSchema) {
    if (!plugin) return [false, "Plugin is not configured"];
    if (!plugin.can_ban)
      return [
        false,
        "You do not meet the level conditions for banning or banning is disabled",
      ];
    return [true, ""];
  },
  async execute(
    interaction,
    ctx: { level: number; plugin?: BaseModActionsSchema },
  ) {
    const target = interaction.options.getUser("target", true);
    const reason =
      interaction.options.getString("reason") ?? "No reason provided";
    const duration = interaction.options.getString("duration");
    const deleteDuration = interaction.options.getString("delete") || "1h";

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

    if (alreadyBanned.ban) {
      interaction.reply({
        content: `${target.tag} is already banned from this server.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const handlebarsTemplate = handlebars.compile(ctx.plugin!.ban_message, {
      noEscape: true,
    });

    const message = handlebarsTemplate({
      moderator: interaction.user.tag,
      reason,
      guildName: interaction.guild?.name,
    });

    let banCase: CasesCreateOutput | null = null;
    if (!duration) {
      banCase = await createCase({
        caseType: "ban",
        guildId: interaction.guild!.id,
        creatorId: interaction.user.id,
        targetId: target.id,
        reason,
      });
    } else {
      banCase = await createCase({
        caseType: "ban",
        guildId: interaction.guild!.id,
        creatorId: interaction.user.id,
        targetId: target.id,
        reason: `(Banned for ${(await makeDuration(duration)).humanize()})${reason}`,
      });
    }

    if (!banCase || !banCase.data) {
      await interaction.reply({
        content: "Failed to create ban case.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const deleteMoment = await makeDuration(deleteDuration);

    if (!deleteMoment.isValid) {
      return interaction.reply({
        content: `The delete duration "${deleteDuration}" is not valid.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (duration) {
      const banDuration = await makeDuration(duration);
      if (!banDuration.isValid) {
        return interaction.reply({
          content: `The ban duration "${duration}" is not valid.`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    setTimeout(async () => {
      try {
        await interaction.guild!.members.ban(target, {
          reason: message,
          deleteMessageSeconds: deleteMoment.seconds(),
        });
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

    await trpc.bot.plugins.modActions.createBan.mutate({
      guildId: getGuild.guild!.uuid,
      targetId: target.id,
      duration: duration
        ? (await makeDuration(duration)).milliseconds()
        : undefined,
      caseId: banCase!.data!.uuid,
      reason: reason,
    });

    await interaction.reply({
      content: `Banned ${target.tag} from the server`,
    });
  },
} as BotCommand;
