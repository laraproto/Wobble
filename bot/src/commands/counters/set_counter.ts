import { type BotCommand } from "#botBase";
import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { type BaseCountersSchema } from "#/types/modules";

import trpc from "#botModules/trpc";

export default {
  data: new SlashCommandBuilder()
    .setName("set_counter")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("user")
        .setDescription("Set counter of a user")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("User to set")
            .setRequired(true),
        )
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
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("channel")
        .setDescription("Set counter of a channel")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Channel to set")
            .setRequired(true),
        )
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
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("global")
        .setDescription("Set a global counter")
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
    )
    .setDescription("Set a counter"),
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
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    const value = interaction.options.getInteger("value", true);
    const counterName = interaction.options.getString("counter_name", true);

    let success: boolean = false;
    let successMessage: string = "";
    switch (subcommand) {
      case "user": {
        const user = interaction.options.getUser("user", true);
        const result = await trpc.bot.plugins.counters.setCounter.mutate({
          guildId: interaction.guild!.id,
          counterName,
          value,
          user_id: user.id,
        });
        success = result.success;
        successMessage = result.message;
        break;
      }
      case "channel": {
        const channel = interaction.options.getChannel("channel", true);
        const result = await trpc.bot.plugins.counters.setCounter.mutate({
          guildId: interaction.guild!.id,
          counterName,
          value,
          channel_id: channel.id,
        });
        success = result.success;
        successMessage = result.message;
        break;
      }
      case "global": {
        const result = await trpc.bot.plugins.counters.setCounter.mutate({
          guildId: interaction.guild!.id,
          counterName,
          value,
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
