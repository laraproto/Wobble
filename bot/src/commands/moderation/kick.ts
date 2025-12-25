import { type BotCommand } from "#botBase";
import { SlashCommandBuilder } from "discord.js";
import { type BaseModActionsSchema } from "#/types/modules";
import handlebars from "handlebars";
import { createCase } from "#botModules/cases";

export default {
  data: new SlashCommandBuilder()
    .setName("kick")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The member to kick")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("The reason for kick"),
    )
    .setDescription("Kicks a user from the server"),
  requiredPlugin: "modActions",
  guildOnly: true,
  async canExecute(plugin?: BaseModActionsSchema) {
    if (!plugin) return [false, "Plugin is not configured"];
    if (!plugin.can_kick)
      return [
        false,
        "You do not meet the level conditions for kicking or kicking is disabled",
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

    const handlebarsTemplate = handlebars.compile(ctx.plugin!.kick_message, {
      noEscape: true,
    });

    const message = handlebarsTemplate({
      moderator: interaction.user.tag,
      reason,
      guildName: interaction.guild?.name,
    });

    await createCase(
      {
        caseType: "kick",
        guildId: interaction.guild!.id,
        creatorId: interaction.user.id,
        targetId: target.id,
        reason,
      },
      false,
    );

    setTimeout(async () => {
      await interaction.guild!.members.kick(target, message);
    }, 3000);

    await interaction.reply({
      content: `Kicked ${target.tag} from the server`,
    });
  },
} as BotCommand;
