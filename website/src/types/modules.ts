import { z } from "zod";
import { zodSnowflake } from "./discord";

// I need a minimum viable product i'm just gonna straight up rip off the zeppelin schema
// With this being being based off the zeppelin schema (the same with the levels thing), I need to think of how to parse level based overrides
// I could do hardcoded to where it's just like pluginSchema modActions:
// z.object({config: modActionsSchema, overrides: z.array(z.object({level: z.string(), config: modActionsSchema}))}) but that would be mad ugly, and tiring
// need to see if zod has anything built in to allow me to generate something like this

export const levelParsingRegex = /^\s*(>=|<=|=|>|<)\s*(\d+)\s*$/;

function plugin<T extends z.ZodObject>(schema: T) {
  return z
    .object({
      config: schema,
      overrides: z
        .array(
          z.object({
            level: z.string(),
            config: schema,
          }),
        )
        .optional(),
    })
    .optional();
}

export const configValidatorSchema = z.object({
  config: z.looseObject({}),
  overrides: z
    .array(
      z.object({
        level: z.string(),
        config: z.looseObject({}),
      }),
    )
    .optional(),
});

export type ConfigValidatorSchema = z.infer<typeof configValidatorSchema>;

export const baseModActionsSchema = z.object({
  dm_on_warn: z.boolean().default(true),
  dm_on_kick: z.boolean().default(false),
  dm_on_ban: z.boolean().default(false),
  warn_message: z
    .string()
    .max(2000)
    .default(
      "You have received a warning on the {{guildName}} server: {{reason}}",
    ),
  kick_message: z
    .string()
    .max(2000)
    .default("You have been kicked from the {{guildName}} server: {{reason}}"),
  ban_message: z
    .string()
    .max(2000)
    .default("You have been banned from the {{guildName}} server: {{reason}}"),
  tempban_message: z
    .string()
    .max(2000)
    .default(
      "You have been temporarily banned from the {{guildName}} server for {{duration}}: {{reason}}",
    ),
  can_note: z.boolean().default(false),
  can_warn: z.boolean().default(false),
  can_mute: z.boolean().default(false),
  can_kick: z.boolean().default(false),
  can_ban: z.boolean().default(false),
  can_unban: z.boolean().default(false),
  can_view: z.boolean().default(false),
  can_addcase: z.boolean().default(false),
  can_massunban: z.boolean().default(false),
  can_massban: z.boolean().default(false),
  can_massmute: z.boolean().default(false),
  can_hidecase: z.boolean().default(false),
  can_deletecase: z.boolean().default(false),
});

const modActionsSchema = plugin(baseModActionsSchema);

export const pluginsSchema = z.object({
  modActions: modActionsSchema,
});

export const botConfigSchema = z.object({
  levels: z.record(zodSnowflake, z.number().min(0).max(100)).optional(),

  plugins: pluginsSchema.optional(),
});

export type BotConfigSchema = z.infer<typeof botConfigSchema>;

export {};
