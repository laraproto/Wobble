import z from "zod";
import { zodSnowflake } from "./discord";

export const wsEvents = z.enum([
  "guildUpdate",
  "guildDestroy",
  "guildRefetch",
  "counterTrigger",
  "guildUnban",
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
  per_user: z.boolean().default(false),
  per_channel: z.boolean().default(false),
  channel_id: zodSnowflake.optional(),
  user_id: zodSnowflake.optional(),
});

export const guildUnbanEvent = z.object({
  guild_id: zodSnowflake,
  user_id: zodSnowflake,
  creator_id: zodSnowflake.optional(),
  reason: z.string(),
});

export type GuildIdEvent = z.infer<typeof guildIdEvent>;

export type CounterTriggerEvent = z.infer<typeof counterTriggerEvent>;

export type UnbanEvent = z.infer<typeof guildUnbanEvent>;

export const wsEventPayloads = z.union([
  guildIdEvent,
  counterTriggerEvent,
  guildUnbanEvent,
]);

export type WSEventPayloads = z.infer<typeof wsEventPayloads>;

export const wsMessage = z.object({
  event: wsEvents,
  data: wsEventPayloads,
});

export type WSMessage = z.infer<typeof wsMessage>;

export {};
