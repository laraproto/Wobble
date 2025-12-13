import z from "zod";
import { zodSnowflake } from "./discord";

export const wsEvents = z.enum(["guildUpdate", "guildDestroy", "guildRefetch"]);

export type WSEvents = z.infer<typeof wsEvents>;

export const guildIdEvent = z.object({
  guildId: zodSnowflake,
});

export type GuildIdEvent = z.infer<typeof guildIdEvent>;

export const wsEventPayloads = z.union([guildIdEvent]);

export type WSEventPayloads = z.infer<typeof wsEventPayloads>;

export const wsMessage = z.object({
  event: wsEvents,
  data: wsEventPayloads,
});

export type WSMessage = z.infer<typeof wsMessage>;

export {};
