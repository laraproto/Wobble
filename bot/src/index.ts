import { BOT_TOKEN } from "#modules/config";
import { Client, Events, GatewayIntentBits } from "discord.js";

if (import.meta.main) {
  console.log("You are not supposed to run this");
  process.exit(0);
}

export const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

export const botInit = async () => {
  const stringReturn = await client.login(BOT_TOKEN);

  return !!stringReturn;
};
