import { BOT_SESSION, URL } from "./config";
import {
  type WSMessage,
  type GuildIdEvent,
  type CounterTriggerEvent,
} from "#/types/ws";
import trpc from "#botModules/trpc";
import { client } from "#botBase";
import type { DiscordAPIError } from "discord.js";
import { processCounterTrigger } from "./counter";

export const WS_URL = `${URL}api/ws`;

export const WSClient = new WebSocket(WS_URL, {
  headers: {
    authorization: BOT_SESSION,
  },
});

WSClient.addEventListener("close", (event) => console.log(event));

WSClient.addEventListener("error", (event) => console.error(event));

WSClient.addEventListener("message", async (event) => {
  console.log(event.data);
  await processWSEvents(event.data);
});

async function processWSEvents(data: string) {
  let parsedData: WSMessage;
  try {
    parsedData = JSON.parse(data) as WSMessage;
  } catch (e) {
    console.error("Failed to parse WS message:", e);
    return;
  }

  switch (parsedData.event) {
    case "guildUpdate": {
      try {
        const parsedEvent = parsedData.data as GuildIdEvent;
        const guild = await client.guilds.fetch(parsedEvent.guildId);

        const trpcQuery = await trpc.bot.updateGuild.mutate({
          name: guild.name,
          guildId: guild.id,
          iconHash: guild.icon,
          bannerHash: guild.banner,
          ownerId: guild.ownerId,
        });

        if (trpcQuery.success) {
          console.log("Guild updated successfully:", guild.id);
        }

        break;
      } catch (err) {
        const discordApiError = err as DiscordAPIError;
        if (discordApiError.code === 10004) {
          console.log("Bot isn't in server, purging it from api");
          const parsedEvent = parsedData.data as GuildIdEvent;

          const trpcQuery = await trpc.bot.removeGuild.mutate(
            parsedEvent.guildId,
          );
          if (trpcQuery.success) {
            console.log("Guild removed successfully:", parsedEvent.guildId);
          } else {
            console.error("Error removing guild:", trpcQuery.message);
          }
          break;
        }
        console.error("Error updating guild:", err);
        break;
      }
    }
    case "guildRefetch": {
      try {
        const parsedEvent = parsedData.data as GuildIdEvent;

        const guild = await client.guilds.fetch(parsedEvent.guildId);

        const getGuild = await trpc.bot.checkGuild.query(guild.id);

        if (!getGuild.success || !getGuild.guild) break;

        client.guildConfig!.set(parsedEvent.guildId, getGuild.guild.settings);
        console.log("Guild refetched and updated successfully:", guild.id);
        break;
      } catch (err) {
        console.error("Error refetching guild:", err);
        break;
      }
    }
    case "counterTrigger": {
      const parsedEvent = parsedData.data as CounterTriggerEvent;

      await processCounterTrigger(parsedEvent);

      break;
    }
    default: {
      console.log("Received unhandled WS event:", parsedData);
      break;
    }
  }
}
