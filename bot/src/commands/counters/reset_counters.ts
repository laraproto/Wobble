import { type BotCommand } from "#botBase";
import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { type BaseCountersSchema } from "#/types/modules";

import trpc from "#botModules/trpc";

export default {
  data: new SlashCommandBuilder()
    .setName("reset_counter")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("user")
        .setDescription("Reset counter of a user")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("User to reset")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("counter_name")
            .setDescription("The name of the counter to reset")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("channel")
        .setDescription("Reset counter of a channel")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Channel to reset")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("counter_name")
            .setDescription("The name of the counter to reset")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("global")
        .setDescription("Reset a global counter")
        .addStringOption((option) =>
          option
            .setName("counter_name")
            .setDescription("The name of the counter to reset")
            .setRequired(true),
        ),
    )
    .setDescription("Reset a counter"),
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
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    const counterName = interaction.options.getString("counter_name", true);

    let success: boolean = false;
    let successMessage: string = "";
    switch (subcommand) {
      case "user": {
        const user = interaction.options.getUser("user", true);
        const result = await trpc.bot.plugins.counters.resetCounter.mutate({
          guildId: interaction.guild!.id,
          counterName,
          user_id: user.id,
        });
        success = result.success;
        successMessage = result.message;
        break;
      }
      case "channel": {
        const channel = interaction.options.getChannel("channel", true);
        const result = await trpc.bot.plugins.counters.resetCounter.mutate({
          guildId: interaction.guild!.id,
          counterName,
          channel_id: channel.id,
        });
        success = result.success;
        successMessage = result.message;
        break;
      }
      case "global": {
        const result = await trpc.bot.plugins.counters.resetCounter.mutate({
          guildId: interaction.guild!.id,
          counterName,
        });
        success = result.success;
        successMessage = result.message;
        break;
      }
    }

    if (success) {
      await interaction.reply({
        content: `✅ ${successMessage}`,
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({
        content: `❌ ${successMessage}`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
} as BotCommand;
