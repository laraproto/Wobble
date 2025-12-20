import z from "zod";
import { zodSnowflake } from "./discord";

export const wsEvents = z.enum([
  "guildUpdate",
  "guildDestroy",
  "guildRefetch",
  "counterTrigger",
]);

export type WSEvents = z.infer<typeof wsEvents>;

export const guildIdEvent = z.object({
  guildId: zodSnowflake,
});

export const counterTriggerEvent = z.object({
  counter_id: z.uuid(),
  counter_name: z.string(),
  guild_id: zodSnowflake,
  trigger_id: z.uuid(),
  trigger_name: z.string(),
});

export type GuildIdEvent = z.infer<typeof guildIdEvent>;

export type CounterTriggerEvent = z.infer<typeof counterTriggerEvent>;

export const wsEventPayloads = z.union([guildIdEvent, counterTriggerEvent]);

export type WSEventPayloads = z.infer<typeof wsEventPayloads>;

export const wsMessage = z.object({
  event: wsEvents,
  data: wsEventPayloads,
});

export type WSMessage = z.infer<typeof wsMessage>;

export {};
