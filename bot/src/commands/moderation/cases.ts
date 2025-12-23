import { type BotCommand } from "#botBase";
import { SlashCommandBuilder } from "discord.js";
import { type BaseModActionsSchema } from "#/types/modules";
import trpc from "#botModules/trpc";

export default {
  data: new SlashCommandBuilder()
    .setName("cases")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("server")
        .setDescription("Get all cases issued in the server"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("user")
        .setDescription("Get cases of a user")
        .addUserOption((option) =>
          option
            .setName("target")
            .setDescription("User to get cases of")
            .setRequired(true),
        ),
    )
    .setDescription("Get cases"),
  requiredPlugin: "modActions",
  guildOnly: true,
  async canExecute(plugin?: BaseModActionsSchema) {
    if (!plugin) return [false, "Plugin is not configured"];
    if (!plugin.can_view)
      return [
        false,
        "You do not meet the level conditions for viewing cases or viewing is disabled",
      ];
    return [true, ""];
  },
  async execute(interaction) {
    const subcommand = await interaction.options.getSubcommand();

    switch (subcommand) {
      case "server": {
        const cases = await trpc.bot.plugins.cases.getCases.query({
          guildId: interaction.guild!.id,
        });

        if (!cases.data) {
          await interaction.reply({
            content: "Somethign went wrong fetching cases.",
          });
          return;
        }

        if (cases.data.length === 0) {
          await interaction.reply({
            content: "No cases have been issued in this server.",
          });
          return;
        }

        // I need to add a pagination system to cases with buttons to switch page, sometime soon hopefully but I can't code comfortably rn
      }
    }
  },
} as BotCommand;
