import { type BotCommand } from "#botBase";
import { SlashCommandBuilder } from "discord.js";
import { type BaseModActionsSchema } from "#/types/modules";
import handlebars from "handlebars";

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
    const target = interaction.options.getUser("target");
    const reason =
      interaction.options.getString("reason") ?? "No reason provided";

    const handlebarsTemplate = handlebars.compile(ctx.plugin!.kick_message, {
      noEscape: true,
    });

    await interaction.reply({
      content: handlebarsTemplate({
        guildName: interaction.guild!.name,
        reason,
      }),
    });
  },
} as BotCommand;
