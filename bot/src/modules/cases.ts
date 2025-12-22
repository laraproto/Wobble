import trpc, { type RouterInput, type RouterOutput } from "#botModules/trpc";
import { client } from "#botBase";
import { checkLevel } from "./level";
import { parseConfig } from "@wobble/website/configParser";
import {
  type GuildTextBasedChannel,
  type HexColorString,
  type Message,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  GuildMember,
  ButtonStyle,
} from "discord.js";
import handlebars from "handlebars";

type CasesCreateInput = RouterInput["bot"]["plugins"]["cases"]["createCase"];
export type CasesCreateOutput =
  RouterOutput["bot"]["plugins"]["cases"]["createCase"];

export async function createCase(
  input: CasesCreateInput,
): Promise<CasesCreateOutput | null> {
  const guildSettings = client.guildConfig!.get(input.guildId);

  if (!guildSettings) {
    return null;
  }

  if (!guildSettings.plugins.cases) {
    return null;
  }

  let casePlugin = guildSettings.plugins.cases.config;

  if (!casePlugin) {
    return null;
  }

  let level = 0;
  if (input.creatorId) {
    level = await checkLevel(guildSettings, input.guildId, input.creatorId);
  }

  casePlugin = await parseConfig(guildSettings.plugins.cases, level);

  if (!casePlugin) {
    return null;
  }

  const guild = await client.guilds.fetch(input.guildId);

  const actualGuildUUID = await trpc.bot.checkGuild.query(input.guildId);

  if (!actualGuildUUID || !actualGuildUUID.guild) {
    return null;
  }

  const guildId = input.guildId;
  input.guildId = actualGuildUUID.guild.uuid;

  let channel: GuildTextBasedChannel | null = null;

  if (casePlugin.casesChannel) {
    const channelFetch = await guild.channels.fetch(casePlugin.casesChannel);

    if (channelFetch && channelFetch.isTextBased()) {
      channel = channelFetch;
    }
  }

  let authorMember: GuildMember | null = null;
  if (input.creatorId) {
    authorMember = await guild.members.fetch(input.creatorId);
  }

  const targetMember = await guild.members.fetch(input.targetId);

  let caseMessage: Message<true> | null = null;

  const caseColor = !casePlugin.caseColors
    ? "#ffffff"
    : casePlugin.caseColors[
        input.caseType as keyof typeof casePlugin.caseColors
      ] || "#ffffff";

  const caseIcon = !casePlugin.caseIcons
    ? ""
    : casePlugin.caseIcons[
        input.caseType as keyof typeof casePlugin.caseIcons
      ] || "";

  const builtEmbed = new EmbedBuilder()
    .setTitle(`${caseIcon} ${input.caseType.toUpperCase()} - New case`)
    .setDescription(input.reason || "No reason provided.")
    .setColor(caseColor as HexColorString)
    .addFields([
      {
        name: "User",
        value: `${targetMember.user.tag} (${targetMember.id})`,
        inline: true,
      },
      {
        name: "Author",
        value: authorMember
          ? `${authorMember.user.tag} (${authorMember.id})`
          : "Automated action",
        inline: true,
      },
    ]);

  if (channel) {
    caseMessage = await channel.send({
      embeds: [builtEmbed],
    });
  }

  if (channel && caseMessage) {
    input.messageId = caseMessage.id;
  }

  const result = await trpc.bot.plugins.cases.createCase.mutate(input);

  if (caseMessage && result.success && result.data) {
    const updatedEmbed = EmbedBuilder.from(builtEmbed)
      .setTitle(`${caseIcon} ${input.caseType.toUpperCase()}`)
      .setFooter({ text: `Case ID: ${result.data.uuid}` });
    caseMessage.edit({
      embeds: [updatedEmbed],
    });
  }

  await handleCaseDM({ ...input, guildId: guildId });

  return result;
}

export async function handleCaseDM(input: CasesCreateInput): Promise<void> {
  const guildSettings = client.guildConfig!.get(input.guildId);

  if (!guildSettings) {
    return;
  }

  if (!guildSettings.plugins.modActions) {
    return;
  }

  let modActionsPlugin = guildSettings.plugins.modActions.config;

  if (!modActionsPlugin) {
    return;
  }

  let level = 0;
  if (input.creatorId) {
    level = await checkLevel(guildSettings, input.guildId, input.creatorId);
  }

  modActionsPlugin = await parseConfig(guildSettings.plugins.modActions, level);

  if (!modActionsPlugin) {
    return;
  }

  const guild = await client.guilds.fetch(input.guildId).catch(() => null);

  if (!guild) {
    return;
  }

  let creatorMember: GuildMember | null = null;
  if (input.creatorId) {
    creatorMember = await guild.members
      .fetch(input.creatorId)
      .catch(() => null);
  }

  const member = await guild.members.fetch(input.targetId).catch(() => null);

  if (!member) {
    return;
  }

  const originButton = new ButtonBuilder()
    .setCustomId("origin")
    .setLabel(`Sent from: ${guild.name} (${guild.id})`)
    .setStyle(ButtonStyle.Primary)
    .setDisabled(true);

  const originRow = new ActionRowBuilder().addComponents(originButton);

  console.log(
    modActionsPlugin.dm_on_ban,
    modActionsPlugin.dm_on_kick,
    modActionsPlugin.dm_on_warn,
    input.caseType,
  );

  switch (true) {
    case modActionsPlugin.dm_on_ban && input.caseType === "ban": {
      const handlebarsTemplate = handlebars.compile(
        modActionsPlugin.ban_message,
        {
          noEscape: true,
        },
      );

      const dmMessage = handlebarsTemplate({
        guildName: guild.name,
        reason: input.reason || "No reason provided.",
        moderatorTag: creatorMember?.user.tag ?? "Automated action",
      });

      member.user.send({
        content: dmMessage,
        components: [originRow.toJSON()],
      });
      break;
    }
    case modActionsPlugin.dm_on_kick && input.caseType === "kick": {
      const handlebarsTemplate = handlebars.compile(
        modActionsPlugin.kick_message,
        {
          noEscape: true,
        },
      );

      const dmMessage = handlebarsTemplate({
        guildName: guild.name,
        reason: input.reason || "No reason provided.",
        moderatorTag: creatorMember?.user.tag ?? "Automated action",
      });

      member.user.send({
        content: dmMessage,
        components: [originRow.toJSON()],
      });
      break;
    }
    case modActionsPlugin.dm_on_warn && input.caseType === "warn": {
      const handlebarsTemplate = handlebars.compile(
        modActionsPlugin.warn_message,
        {
          noEscape: true,
        },
      );

      const dmMessage = handlebarsTemplate({
        guildName: guild.name,
        reason: input.reason || "No reason provided.",
        moderatorTag: creatorMember?.user.tag ?? "Automated action",
      });

      member.user.send({
        content: dmMessage,
        components: [originRow.toJSON()],
      });
      break;
    }
  }
}
