import z from "zod";

export const snowflakeRegex = /[1-9][0-9]{5,19}/;

export const zodSnowflake = z
  .string()
  .regex(snowflakeRegex, "Invalid snowflake");

export type Snowflake = z.infer<typeof zodSnowflake>;

export const guildProperty = z.object({
  id: z.uuid(),
  name: z.string(),
  permissions: z.number(),
  icon: z.string().nullable(),
  banner: z.string().nullable().optional(),
  owner: z.boolean(),
  inviteable: z.boolean(),
  uuid: z.string().nullable(),
});

export type GuildProperty = z.infer<typeof guildProperty>;
