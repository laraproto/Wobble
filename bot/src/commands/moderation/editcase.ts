import { type BotCommand } from "#botBase";
import {
  EmbedBuilder,
  SlashCommandBuilder,
  type TextBasedChannel,
} from "discord.js";
import { type BaseModActionsSchema } from "#/types/modules";
import trpc from "#botModules/trpc";

export default {
  data: new SlashCommandBuilder()
    .setName("editcase")
    .addStringOption((option) =>
      option
        .setName("case")
        .setDescription("The case to edit (case ID)")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for note")
        .setRequired(true),
    )
    .setDescription("Adds a note to a user"),
  requiredPlugin: "modActions",
  guildOnly: true,
  async canExecute(plugin?: BaseModActionsSchema) {
    if (!plugin) return [false, "Plugin is not configured"];
    if (!plugin.can_addcase)
      // No edit permission lmao, i cba to add a new one
      return [
        false,
        "You do not meet the level conditions for editing cases or editing is disabled",
      ];
    return [true, ""];
  },
  async execute(interaction) {
    const caseId = interaction.options.getString("case", true);
    const reason = interaction.options.getString("reason", true);

    const guildInfo = await trpc.bot.checkGuild.query(interaction.guild!.id);

    if (!guildInfo || !guildInfo.guild) {
      await interaction.reply({
        content: "I do not know what this guild is",
      });
      return;
    }

    const caseUpdate = await trpc.bot.plugins.cases.editCase.mutate({
      guildId: guildInfo.guild!.uuid,
      caseId,
      reason,
    });

    if (!caseUpdate.success) {
      await interaction.reply({
        content: `Failed to edit case: ${caseUpdate.message}`,
      });
      return;
    }

    if (
      caseUpdate.data &&
      caseUpdate.data.channelId &&
      caseUpdate.data.messageId
    ) {
      const channel = (await interaction
        .guild!.channels.fetch(caseUpdate.data.channelId)
        .catch(() => null)) as TextBasedChannel | null;
      const message = await channel?.messages
        .fetch(caseUpdate.data.messageId)
        .catch(() => null);

      if (message && message.embeds[0]) {
        const embedNew = EmbedBuilder.from(message.embeds[0]);

        embedNew.addFields([
          {
            name: `Edited by ${interaction.user.tag} at ${new Date().toISOString()}`,
            value: reason,
          },
        ]);

        await message.edit({ embeds: [embedNew] });
      }

      await interaction.reply({
        content: `Case ${caseId} edited`,
      });
    }
  },
} as BotCommand;
