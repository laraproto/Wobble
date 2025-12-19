import { BOT_TOKEN } from "#botModules/config";
import {
  ChatInputCommandInteraction,
  Client,
  REST,
  Collection,
  Events,
  GatewayIntentBits,
  Guild,
  SlashCommandBuilder,
  InteractionType,
  MessageFlags,
} from "discord.js";
import trpc from "#botModules/trpc";
import "#botModules/ws";
import type { BotConfigSchema, PluginsList } from "#/types/modules.ts";
import { checkLevel } from "#botModules/level/index.ts";
import { parseConfig } from "@wobble/website/configParser";

if (import.meta.main) {
  console.log("You are not supposed to run this");
  process.exit(0);
}

export interface BotCommand {
  data: SlashCommandBuilder;
  guildOnly: boolean;
  // right now a command can only depend on one plugin, might change in the future
  requiredPlugin?: PluginsList;
  execute: <T>(
    interaction: ChatInputCommandInteraction,
    ctx: {
      level: number;
      guildSettings?: BotConfigSchema;
      plugin?: T;
    },
  ) => Promise<void>;
}

export const rest = new REST().setToken(BOT_TOKEN);

export const client: Client<boolean> & {
  commands?: Collection<string, BotCommand>;
  // Guild config schema is not yet made
  guildConfig?: Collection<string, BotConfigSchema>;
} = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection<string, BotCommand>();

client.guildConfig = new Collection<string, BotConfigSchema>();

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);

  console.log("Checking guilds for any possible misses");
  readyClient.guilds.cache.forEach(async (guild) => {
    const getGuild = await trpc.bot.checkGuild.query(guild.id);

    if (!getGuild.guild) {
      console.log(`Guild not found in DB, adding: ${guild.name}`);
      const addGuildResult = await addGuild(guild);

      if (addGuildResult.success && addGuildResult.guild) {
        console.log(`Successfully added guild: ${guild.name}`);
        client.guildConfig!.set(guild.id, addGuildResult.guild.settings);
      } else {
        console.log(
          `Failed to add guild: ${guild.name}, Reason: ${addGuildResult.message}`,
        );
      }
    } else {
      client.guildConfig!.set(guild.id, getGuild.guild.settings);
    }
  });

  await import("./commands/index.ts");
});

client.on(Events.GuildCreate, async (createEvent) => {
  console.log(`Joined guild: ${createEvent.name}`);
  const addGuildResult = await addGuild(createEvent);

  if (addGuildResult.success && addGuildResult.guild) {
    console.log(`Successfully added guild: ${createEvent.name}`);
    client.guildConfig!.set(createEvent.id, addGuildResult.guild.settings);
  } else {
    console.log(
      `Failed to add guild: ${createEvent.name}, Reason: ${addGuildResult.message}`,
    );
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  switch (interaction.type) {
    case InteractionType.ApplicationCommand: {
      if (!interaction.isChatInputCommand()) return;

      const command = client.commands!.get(interaction.commandName);

      if (!command) {
        console.error(
          `Attempt to execute command ${interaction.commandName} failed, no matching command`,
        );
        return;
      }

      let level: number = 0;
      if (!interaction.guild && command.guildOnly) {
        await interaction.reply({
          content: "This command can only be used in a server.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      let guildSettings: BotConfigSchema | undefined = undefined;
      if (interaction.guild) {
        guildSettings = client.guildConfig!.get(interaction.guild.id);
        if (!guildSettings) {
          await interaction.reply({
            content: "I don't know what this server is.",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        level = await checkLevel(
          guildSettings,
          interaction.guild.id,
          interaction.user.id,
        );
      }

      let plugin: unknown | undefined = undefined;
      if (command.requiredPlugin) {
        if (!guildSettings || !guildSettings.plugins) {
          await interaction.reply({
            content: "This server has no plugins configured.",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        const foundPlugin =
          guildSettings.plugins[
            command.requiredPlugin as keyof typeof guildSettings.plugins
          ];
        if (!foundPlugin) {
          await interaction.reply({
            content: `The required plugin (${command.requiredPlugin}) is not configured on this server.`,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        const parsedConfig = await parseConfig(foundPlugin, level);
        plugin = parsedConfig;
      }

      try {
        await command.execute(interaction, { level, guildSettings, plugin });
      } catch (err) {
        console.error(err);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: "There was an error while executing this command!",
            flags: MessageFlags.Ephemeral,
          });
        } else {
          await interaction.reply({
            content: "There was an error while executing this command!",
            flags: MessageFlags.Ephemeral,
          });
        }
      }
    }
  }
});

export const botInit = async () => {
  const stringReturn = await client.login(BOT_TOKEN);

  return !!stringReturn;
};

const addGuild = async (guild: Guild) => {
  return await trpc.bot.addGuild.mutate({
    guildId: guild.id,
    name: guild.name,
    ownerId: guild.ownerId,
    iconHash: guild.icon ?? null,
    bannerHash: guild.banner ?? null,
  });
};
