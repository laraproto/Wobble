import { BOT_TOKEN } from "#botModules/config";
import { Client, Events, GatewayIntentBits } from "discord.js";
import trpc from "#botModules/trpc";

if (import.meta.main) {
  console.log("You are not supposed to run this");
  process.exit(0);
}

export const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.GuildCreate, async (createEvent) => {
  console.log(`Joined guild: ${createEvent.name}`);
  console.log(await trpc.hello.query({ name: "bot" }));
});

export const botInit = async () => {
  const stringReturn = await client.login(BOT_TOKEN);

  return !!stringReturn;
};
