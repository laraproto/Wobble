import { BOT_TOKEN } from "#botModules/config";
import { Client, Events, GatewayIntentBits, Guild } from "discord.js";
import trpc from "#botModules/trpc";

if (import.meta.main) {
  console.log("You are not supposed to run this");
  process.exit(0);
}

export const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);

  console.log("Checking guilds for any possible misses");
  readyClient.guilds.cache.forEach(async (guild) => {
    const getGuild = await trpc.bot.checkGuild.query(guild.id);

    if (!getGuild.guild) {
      console.log(`Guild not found in DB, adding: ${guild.name}`);
      const addGuildResult = await addGuild(guild);

      if (addGuildResult.success) {
        console.log(`Successfully added guild: ${guild.name}`);
      } else {
        console.log(
          `Failed to add guild: ${guild.name}, Reason: ${addGuildResult.message}`,
        );
      }
    }
  });
});

client.on(Events.GuildCreate, async (createEvent) => {
  console.log(`Joined guild: ${createEvent.name}`);
  const addGuildResult = await addGuild(createEvent);

  if (addGuildResult.success) {
    console.log(`Successfully added guild: ${createEvent.name}`);
  } else {
    console.log(
      `Failed to add guild: ${createEvent.name}, Reason: ${addGuildResult.message}`,
    );
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
    bannnerHash: guild.banner ?? null,
  });
};
