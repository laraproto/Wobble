import { type BotCommand } from "#botBase";
import { MessageFlags, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { type BaseModActionsSchema } from "#/types/modules";
import type { CasesGetOutput } from "#botModules/cases";
import trpc from "#botModules/trpc";

export default {
  data: new SlashCommandBuilder()
    .setName("cases")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("server")
        .setDescription("Get all cases issued in the server")
        .addNumberOption((option) =>
          option.setName("page").setDescription("Page number"),
        ),
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
        )
        .addNumberOption((option) =>
          option.setName("page").setDescription("Page number"),
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
    const subcommand = interaction.options.getSubcommand();
    const page = interaction.options.getNumber("page") || 1;

    const guildInfo = await trpc.bot.checkGuild.query(interaction.guild!.id);
    if (!guildInfo || !guildInfo.guild) {
      await interaction.reply({
        content: "I do not know what this guild is",
        flags: MessageFlags.Ephemeral,
      });
    }

    switch (subcommand) {
      case "server": {
        const cases = await trpc.bot.plugins.cases.getCases.query({
          guildId: guildInfo.guild!.uuid,
          page,
        });

        if (!cases.data) {
          await interaction.reply({
            content: "Something went wrong fetching cases.",
          });
          return;
        }

        if (cases.total === 0) {
          await interaction.reply({
            content: "No cases have been issued in this server.",
          });
          return;
        } else if (cases.total !== 0 && cases.data.length === 0) {
          await interaction.reply({
            content: "No cases found on this page.",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        await interaction.reply({ embeds: [await makeEmbed(cases, interaction.guild!.id, page, "server")] });

        break;
      }
      case "user": {
        const target = interaction.options.getUser("target", true);

        const cases = await trpc.bot.plugins.cases.getCasesByUser.query({
          guildId: guildInfo.guild!.uuid,
          userId: target.id,
          page,
        })

        if (!cases.data) {
          await interaction.reply({
            content: "Something went wrong fetching cases.",
          });
          return;
        }

        if (cases.total === 0) {
          await interaction.reply({
            content: "No cases have been issued for this user.",
            allowedMentions: {} // Idk why I added this, maybe i'll add a ping to profile link or not
          })
        } else if (cases.total !== 0 && cases.data.length === 0) {
          await interaction.reply({
            content: "No cases found on this page.",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        await interaction.reply({ embeds: [await makeEmbed(cases, interaction.guild!.id, page, "user", target.id, target.tag)] });
        break;
      }
    }
  },
} as BotCommand;

async function makeEmbed(caseOutput: NonNullable<CasesGetOutput>, guildId: string, page: number, type: "server" | "user", userId?: string, username?: string) {
  
  if (!caseOutput.pageTotal) {
    return new EmbedBuilder().setTitle("No cases found");
  }

  const caseData: NonNullable<CasesGetOutput["data"]> = caseOutput.data as NonNullable<CasesGetOutput["data"]>;
  let casesList = "";
  for await (const caseInfo of caseData) {
    casesList += `**Case ${caseInfo.uuid}** - ${caseInfo.caseType.toUpperCase()} ${type === "server" ? `- Target: <@${caseInfo.targetId}>` : ""} - ${caseInfo.creatorId ?`Moderator: <@${ caseInfo.creatorId }>` : "Automated action"} - [Post](https://discord.com/channels/${guildId}/${caseInfo.channelId}/${caseInfo.messageId}): ${caseInfo.reason}\n`;
  }

  return new EmbedBuilder().setTitle(type === "server" ?`Serverwide cases - Page ${page}` : `Cases for ${username} - Page ${page}`).setDescription(casesList).setFooter({
    text: caseOutput.pageTotal > 1 ? `To view the next page, use /cases ${type} page:${page + 1} ${type === "user" && userId ? `target:<@${userId}>` : ""}` : "This is the only page of cases.",
  });
}