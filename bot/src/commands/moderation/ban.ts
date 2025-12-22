import { type BotCommand } from "#botBase";
import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { type BaseModActionsSchema } from "#/types/modules";
import handlebars from "handlebars";
import { createCase, type CasesCreateOutput } from "#botModules/cases";
import { makeDuration } from "@wobble/website/configParser";
import trpc from "#botModules/trpc";

export default {
  data: new SlashCommandBuilder()
    .setName("ban")
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
      await interaction.guild!.members.ban(target, {
        reason: message,
        deleteMessageSeconds: deleteMoment.seconds(),
      });
    }, 3000);

    await trpc.bot.plugins.modActions.createBan.mutate({
      guildId: interaction.guild!.id,
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
