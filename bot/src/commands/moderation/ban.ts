import { type BotCommand } from "#botBase";
import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { type BaseModActionsSchema } from "#/types/modules";
import handlebars from "handlebars";
import { createCase } from "#botModules/cases";
import { makeDuration } from "@wobble/website/configParser";

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

    await createCase({
      caseType: "ban",
      guildId: interaction.guild!.id,
      creatorId: interaction.user.id,
      targetId: target.id,
      reason,
    });

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
      if (!duration) {
        await interaction.guild!.members.ban(target, {
          reason: message,
          deleteMessageSeconds: deleteMoment.seconds(),
        });
      } else {
        await interaction.guild!.members.ban(target, {
          reason: message,
          deleteMessageSeconds: deleteMoment.seconds(),
        });
      }
    }, 3000);

    await interaction.reply({
      content: `Kicked ${target.tag} from the server`,
    });
  },
} as BotCommand;
