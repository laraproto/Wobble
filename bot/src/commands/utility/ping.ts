import { type BotCommand, client } from "#botBase";
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Gets current round trip latency"),
  guildOnly: false,
  async execute(interaction) {
    const sent = await interaction.reply({ content: "Pinging..." });

    const embed = new EmbedBuilder()
      .setColor("#32a852")
      .setTitle("Pong!")
      .addFields(
        {
          name: "Heartbeat Latency",
          value: `${client.ws.ping}ms`,
          inline: true,
        },
        {
          name: "Roundtrip Latency",
          value: `${sent.createdTimestamp - interaction.createdTimestamp}ms`,
          inline: true,
        },
      );

    await interaction.editReply({
      content: "",
      embeds: [embed],
    });
  },
} as BotCommand;
