import { z } from "zod";
import { zodSnowflake } from "./discord";

// I need a minimum viable product i'm just gonna straight up rip off the zeppelin schema
// With this being being based off the zeppelin schema (the same with the levels thing), I need to think of how to parse level based overrides
// I could do hardcoded to where it's just like pluginSchema modActions:
// z.object({config: modActionsSchema, overrides: z.array(z.object({level: z.string(), config: modActionsSchema}))}) but that would be mad ugly, and tiring
// need to see if zod has anything built in to allow me to generate something like this

export const operationParsingRegex = /^\s*(>=|<=|=|>|<)\s*(\d+)\s*$/;
export const durationParsingRegex =
  /^((?:\d+(?:\.\d+)?|\.\d+))\s*(mo|y|w|d|h|m|s)$/i;

function plugin<T extends z.ZodObject>(schema: T) {
  return z
    .object({
      //@ts-expect-error this works, loads default config if none provided
      config: schema.prefault({}),
      overrides: z
        .array(
          z.object({
            level: z.string().regex(operationParsingRegex),
            config: schema.partial(),
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

export type BaseModActionsSchema = z.infer<typeof baseModActionsSchema>;

const modActionsSchema = plugin(baseModActionsSchema);

export const baseCounterObjectSchema = z.object({
  per_channel: z.boolean().default(false),
  per_user: z.boolean().default(false),
  initial_value: z.number().default(0),
  triggers: z.record(
    z.string(),
    z.object({
      condition: z.string().regex(operationParsingRegex),
    }),
  ),
  decay: z
    .object({
      amount: z.number().min(1).default(1),
      interval: z.string().regex(durationParsingRegex),
    })
    .optional(),
});

export const baseCountersSchema = z.object({
  counters: z.record(z.string(), baseCounterObjectSchema).default({}),
  can_view: z.boolean().default(false),
  can_edit: z.boolean().default(false),
  can_reset_all: z.boolean().default(false),
});

export type BaseCountersSchema = z.infer<typeof baseCountersSchema>;

export type BaseCounterObjectSchema = z.infer<typeof baseCounterObjectSchema>;

const countersSchema = plugin(baseCountersSchema);

export const baseAutomodRuleObjectSchema = z.object({
  enabled: z.boolean().default(true),
  triggers: z.array(
    z.object({
      automod_trigger: z
        .object({
          ruleId: zodSnowflake,
        })
        .optional(),
      //This can only have one counter as input, need to fix that later
      counter_trigger: z
        .object({
          counter: z.string(),
          trigger: z.string(),
        })
        .optional(),
    }),
  ),
  actions: z
    .object({
      warn: z
        .object({
          reason: z
            .string()
            .max(400)
            .default("Automod rule {{rule_name}} triggered"),
        })
        .optional(),
      mute: z
        .object({
          duration: z.string().max(32).optional(),
          reason: z
            .string()
            .max(400)
            .default("Automod rule {{rule_name}} triggered"),
        })
        .optional(),
      kick: z
        .object({
          reason: z
            .string()
            .max(400)
            .default("Automod rule {{rule_name}} triggered"),
        })
        .optional(),
      ban: z
        .object({
          duration: z.string().max(32).optional(),
          reason: z
            .string()
            .max(400)
            .default("Automod rule {{rule_name}} triggered"),
        })
        .optional(),
      add_counter: z
        .object({
          counter: z.string(),
          value: z.number().default(1),
        })
        .optional(),
      remove_counter: z
        .object({
          counter: z.string(),
          value: z.number().default(1),
        })
        .optional(),
    })
    .optional(),
});

export const baseAutomodSchema = z.object({
  rules: z.record(z.string(), baseAutomodRuleObjectSchema),
});

export type BaseAutomodRuleObjectSchema = z.infer<
  typeof baseAutomodRuleObjectSchema
>;

export type BaseAutomodSchema = z.infer<typeof baseAutomodSchema>;

export const automodSchema = plugin(baseAutomodSchema);

export const baseCasesSchema = z.object({
  logAutomaticActions: z.boolean().default(true),
  casesChannel: zodSnowflake.optional(),
  caseColors: z
    .object({
      ban: z.string().default("#f23a15"),
      unban: z.string().default("#96f215"),
      note: z.string().default("#6c6d6b"),
      warn: z.string().default("#f7eb04"),
      kick: z.string().default("#f78a04"),
      mute: z.string().default("#f7aa04"),
      unmute: z.string().default("#9af704"),
      deleted: z.string().default("#04f796"),
      softban: z.string().default("#04f7ef"),
    })
    .optional(),
  caseIcons: z
    .object({
      ban: z.string().default("🔨"),
      unban: z.string().default("❌🔨"),
      note: z.string().default("📝"),
      warn: z.string().default("⚠️"),
      kick: z.string().default("🥾"),
      mute: z.string().default("🔇"),
      unmute: z.string().default("🔊"),
      deleted: z.string().default("❌📝"),
      softban: z.string().default("🥾🔨"),
    })
    .optional(),
});

export type BaseCasesSchema = z.infer<typeof baseCasesSchema>;

const casesSchema = plugin(baseCasesSchema);

export const pluginsSchema = z.object({
  modActions: modActionsSchema,
  counters: countersSchema,
  automod: automodSchema,
  cases: casesSchema,
});

export const pluginsList = z.enum(pluginsSchema.keyof().options);

export type PluginsList = z.infer<typeof pluginsList>;

export const pluginsUnion = z.union([
  modActionsSchema,
  countersSchema,
  automodSchema,
  casesSchema,
]);

export type PluginsUnion = z.infer<typeof pluginsUnion>;

export const botConfigSchema = z.object({
  levels: z.record(zodSnowflake, z.number().min(0).max(100)).optional(),

  plugins: pluginsSchema.prefault({}),
});

export type BotConfigSchema = z.infer<typeof botConfigSchema>;

export {};
