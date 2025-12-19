import { type BotCommand } from "#botBase";
import { SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("level")
    .setDescription("Gets your level"),
  guildOnly: true,
  async execute(interaction, ctx) {
    await interaction.reply({
      content: `Your level is ${ctx.level}`,
    });
  },
} as BotCommand;
