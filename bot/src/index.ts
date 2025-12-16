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

if (import.meta.main) {
  console.log("You are not supposed to run this");
  process.exit(0);
}

export interface BotCommand {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export const rest = new REST().setToken(BOT_TOKEN);

export const client: Client<boolean> & {
  commands?: Collection<string, BotCommand>;
  // Guild config schema is not yet made
  guildConfig?: Collection<string, unknown>;
} = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection<string, BotCommand>();

client.guildConfig = new Collection<string, unknown>();

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

      try {
        await command.execute(interaction);
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
