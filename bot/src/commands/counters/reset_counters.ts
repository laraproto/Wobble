import { type BotCommand } from "#botBase";
import { SlashCommandBuilder } from "discord.js";
import { type BaseCountersSchema } from "#/types/modules";

export default {
  data: new SlashCommandBuilder()
    .setName("reset_counters")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The member to reset for")
        .setRequired(false),
    )
    .setDescription("Resets all or a single counter"),
  requiredPlugin: "counters",
  guildOnly: true,
  async canExecute(plugin?: BaseCountersSchema) {
    if (!plugin) return [false, "Plugin is not configured"];
    if (!plugin.can_reset_all)
      return [
        false,
        "You do not meet the level conditions for resetting counters or resetting is disabled",
      ];
    return [true, ""];
  },
  async execute(
    interaction,
    ctx: { level: number; plugin?: BaseCountersSchema },
  ) {
    const target = interaction.options.getUser("target");
  },
} as BotCommand;
