import { type BotCommand } from "#botBase";
import { SlashCommandBuilder } from "discord.js";
import { type BaseCountersSchema } from "#/types/modules";

export default {
  data: new SlashCommandBuilder()
    .setName("set_counter")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The member to set for")
        .setRequired(true),
    )
    .setDescription("Set a counter to a specific value")
    .addStringOption((option) =>
      option
        .setName("counter_name")
        .setDescription("The name of the counter to set")
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("value")
        .setDescription("The value to set the counter to")
        .setRequired(true),
    ),
  requiredPlugin: "counters",
  guildOnly: true,
  async canExecute(plugin?: BaseCountersSchema) {
    if (!plugin) return [false, "Plugin is not configured"];
    if (!plugin.can_edit)
      return [
        false,
        "You do not meet the level conditions for setting counters or setting is disabled",
      ];
    return [true, ""];
  },
  async execute(
    interaction,
    ctx: { level: number; plugin?: BaseCountersSchema },
  ) {
    const target = interaction.options.getUser("target", true);
    const counterName = interaction.options.getString("counter_name", true);
    const value = interaction.options.getInteger("value", true);
  },
} as BotCommand;
