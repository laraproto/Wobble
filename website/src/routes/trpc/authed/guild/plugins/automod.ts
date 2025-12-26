import { z } from "zod";
import {
  operationParsingRegex,
  automodSchema,
  baseAutomodRuleObjectSchema,
  botConfigSchema,
} from "#/types/modules";
import { guildProcedure, router } from "#modules/trpc";
import { applyGuildSettings } from "#modules/guild/index.ts";

const automodRuleObjectSchema = z.object({
  enabled: z.boolean(),
  triggers: z.array(
    z.object({
      automod_trigger: z.object({
        ruleId: z.string(),
      }),
      counter_trigger: z.object({
        counter: z.string(),
        trigger: z.string(),
      }),
    }),
  ),
  actions: z.object({
    warn: z.object({
      reason: z
        .string()
        .min(0)
        .max(400)
        .default("Automod rule {{rule_name}} triggered"),
    }),
    mute: z.object({
      duration: z.string().min(0).max(32),
      reason: z
        .string()
        .min(0)
        .max(400)
        .default("Automod rule {{rule_name}} triggered"),
    }),
    kick: z.object({
      reason: z
        .string()
        .max(400)
        .default("Automod rule {{rule_name}} triggered"),
    }),
    ban: z.object({
      duration: z.string().min(0).max(32),
      reason: z
        .string()
        .max(400)
        .default("Automod rule {{rule_name}} triggered"),
    }),
    add_counter: z.object({
      counter: z.string(),
      value: z.number().min(0),
    }),
    remove_counter: z.object({
      counter: z.string(),
      value: z.number().min(0),
    }),
  }),
});

const automodBaseSchema = z.object({
  rules: z.array(z.object({ name: z.string(), rule: automodRuleObjectSchema })),
});

const automodFormSchema = z.object({
  config: automodBaseSchema,
  overrides: z.array(
    z.object({
      level: z.string().regex(operationParsingRegex),
      config: z.object({
        rules: z.array(
          z.object({
            name: z.string(),
            rule: automodRuleObjectSchema.pick({
              enabled: true,
            }),
          }),
        ),
      }),
    }),
  ),
});

type AutomodFormSchema = z.infer<typeof automodFormSchema>;

const guildAutomodRouter = router({
  get: guildProcedure.query(async ({ ctx }) => {
    const automodPlugin = ctx.guild.settings.plugins.automod;

    const convertedAutomod: AutomodFormSchema = {
      config: {
        rules: [],
      },
      overrides: [],
    };

    if (!automodPlugin) {
      return null;
    }

    for (const ruleName in automodPlugin.config.rules) {
      const ruleConfig = automodPlugin.config.rules[ruleName];

      if (!ruleConfig) continue;

      convertedAutomod.config.rules.push({
        name: ruleName,
        rule: {
          enabled: ruleConfig.enabled,
          triggers: ruleConfig.triggers.map((trigger) => ({
            automod_trigger: {
              ruleId: trigger.automod_trigger?.ruleId ?? "",
            },
            counter_trigger: {
              counter: trigger.counter_trigger?.counter ?? "",
              trigger: trigger.counter_trigger?.trigger ?? "",
            },
          })),
          actions: !ruleConfig.actions
            ? {
                warn: {
                  reason: "Automod rule {{rule_name}} triggered",
                },
                mute: {
                  duration: "",
                  reason: "Automod rule {{rule_name}} triggered",
                },
                kick: {
                  reason: "Automod rule {{rule_name}} triggered",
                },
                ban: {
                  duration: "",
                  reason: "Automod rule {{rule_name}} triggered",
                },
                add_counter: {
                  counter: "",
                  value: 0,
                },
                remove_counter: {
                  counter: "",
                  value: 0,
                },
              }
            : {
                warn: !ruleConfig.actions.warn
                  ? {
                      reason: "",
                    }
                  : {
                      reason: ruleConfig.actions.warn.reason,
                    },
                mute: !ruleConfig.actions.mute
                  ? {
                      duration: "",
                      reason: "",
                    }
                  : {
                      duration: ruleConfig.actions.mute.duration,
                      reason: ruleConfig.actions.mute.reason,
                    },
                kick: !ruleConfig.actions.kick
                  ? {
                      reason: "",
                    }
                  : {
                      reason: ruleConfig.actions.kick.reason,
                    },
                ban: !ruleConfig.actions.ban
                  ? {
                      duration: "",
                      reason: "",
                    }
                  : {
                      duration: ruleConfig.actions.ban.duration || "",
                      reason: ruleConfig.actions.ban.reason,
                    },
                add_counter: !ruleConfig.actions.add_counter
                  ? {
                      counter: "",
                      value: 0,
                    }
                  : {
                      counter: ruleConfig.actions.add_counter.counter,
                      value: ruleConfig.actions.add_counter.value,
                    },
                remove_counter: !ruleConfig.actions.remove_counter
                  ? {
                      counter: "",
                      value: 0,
                    }
                  : {
                      counter: ruleConfig.actions.remove_counter.counter,
                      value: ruleConfig.actions.remove_counter.value,
                    },
              },
        },
      });
    }

    const overrideConfig: AutomodFormSchema["overrides"] = [];
    for (const override of automodPlugin.overrides || []) {
      const rules: {
        name: string;
        rule: {
          enabled: boolean;
        };
      }[] = [];

      for (const ruleName in override.config.rules) {
        const ruleConfig = override.config.rules[ruleName];

        if (!ruleConfig) continue;

        rules.push({
          name: ruleName,
          rule: {
            enabled: ruleConfig.enabled,
          },
        });
      }

      overrideConfig.push({
        level: override.level,
        config: {
          rules,
        },
      });
    }

    return { ...convertedAutomod, overrides: overrideConfig };
  }),
  set: guildProcedure
    .input(automodFormSchema)
    .mutation(async ({ ctx, input }) => {
      const automodConversion: z.infer<typeof automodSchema> = {
        config: {
          rules: {},
        },
        overrides: [],
      };

      for (const rule of input.config.rules) {
        const triggers: z.infer<
          typeof baseAutomodRuleObjectSchema.shape.triggers
        > = [];

        let actions: z.infer<typeof baseAutomodRuleObjectSchema.shape.actions> =
          {};

        rule.rule.triggers.forEach((trigger) => {
          triggers.push({
            automod_trigger:
              trigger.automod_trigger.ruleId !== ""
                ? {
                    ruleId: trigger.automod_trigger.ruleId,
                  }
                : undefined,
            counter_trigger:
              trigger.counter_trigger.counter !== "" &&
              trigger.counter_trigger.trigger !== ""
                ? {
                    counter: trigger.counter_trigger.counter,
                    trigger: trigger.counter_trigger.trigger,
                  }
                : undefined,
          });
        });

        if (rule.rule.actions) {
          actions = {
            warn:
              rule.rule.actions.warn.reason !== ""
                ? {
                    reason: rule.rule.actions.warn.reason,
                  }
                : undefined,
            mute:
              rule.rule.actions.mute.reason !== "" &&
              rule.rule.actions.mute.duration !== ""
                ? {
                    duration: rule.rule.actions.mute.duration,
                    reason: rule.rule.actions.mute.reason,
                  }
                : undefined,
            kick:
              rule.rule.actions.kick.reason !== ""
                ? {
                    reason: rule.rule.actions.kick.reason,
                  }
                : undefined,
            ban:
              rule.rule.actions.ban.reason !== ""
                ? {
                    duration:
                      rule.rule.actions.ban.duration === ""
                        ? undefined
                        : rule.rule.actions.ban.duration,
                    reason: rule.rule.actions.ban.reason,
                  }
                : undefined,
            add_counter:
              rule.rule.actions.add_counter.counter !== "" &&
              rule.rule.actions.add_counter.value > 0
                ? {
                    counter: rule.rule.actions.add_counter.counter,
                    value: rule.rule.actions.add_counter.value,
                  }
                : undefined,
            remove_counter:
              rule.rule.actions.remove_counter.counter !== "" &&
              rule.rule.actions.remove_counter.value > 0
                ? {
                    counter: rule.rule.actions.remove_counter.counter,
                    value: rule.rule.actions.remove_counter.value,
                  }
                : undefined,
          };
        }

        automodConversion.config.rules[rule.name] = {
          enabled: rule.rule.enabled,
          triggers,
          actions,
        };
      }

      for (const override of input.overrides) {
        const rules: Record<string, { enabled: boolean }> = {};

        override.config.rules.forEach((r) => {
          rules[r.name] = { enabled: r.rule.enabled };
        });

        automodConversion.overrides!.push({
          level: override.level,
          config: {
            rules,
          },
        });
      }

      const updatedAutomod =
        await automodSchema.safeParseAsync(automodConversion);

      if (!updatedAutomod.success) {
        return {
          success: false,
          message: "Invalid automod configuration",
          error: z.treeifyError(updatedAutomod.error),
        };
      }

      const botConfigParse = await botConfigSchema.safeParseAsync({
        ...ctx.guild.settings,
        plugins: {
          ...ctx.guild.settings.plugins,
          automod: updatedAutomod.data,
        },
      });

      if (!botConfigParse.success) {
        return {
          success: false,
          message: "Failed to update guild configuration",
          error: z.treeifyError(botConfigParse.error),
        };
      }

      await applyGuildSettings(ctx.guild!.guildId, botConfigParse.data);

      return {
        success: true,
        message: "Automod configuration updated successfully",
        data: updatedAutomod.data,
      };
    }),
});

export default guildAutomodRouter;
