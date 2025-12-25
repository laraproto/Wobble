import { z } from "zod";
import { durationParsingRegex, operationParsingRegex } from "#/types/modules";
import {
  botConfigSchema,
  countersSchema,
  baseCounterObjectSchema,
} from "#/types/modules";
import { guildProcedure, router } from "#modules/trpc";
import { applyGuildSettings } from "#modules/guild/index.ts";

const countersBaseSchema = z.object({
  counters: z.array(
    z.object({
      name: z.string(),
      counter: z.object({
        per_channel: z.boolean(),
        per_user: z.boolean(),
        initial_value: z.number(),
        decay: z.object({
          amount: z.number().min(0),
          interval: z.string().regex(durationParsingRegex),
        }),
        triggers: z.array(
          z.object({
            name: z.string(),
            data: z.object({
              condition: z.string().regex(operationParsingRegex),
            }),
          }),
        ),
      }),
    }),
  ),
  can_view: z.boolean(),
  can_edit: z.boolean(),
  can_reset_all: z.boolean(),
});

const countersFormSchema = z.object({
  config: countersBaseSchema,
  overrides: z.array(
    z.object({
      level: z.string().regex(operationParsingRegex),
      config: countersBaseSchema.omit({
        counters: true,
      }),
    }),
  ),
});

type CountersFormSchema = z.infer<typeof countersFormSchema>;

const guildCountersRouter = router({
  get: guildProcedure.query(async ({ ctx }) => {
    const countersPlugin = ctx.guild.settings.plugins.counters;

    const convertedCounters: CountersFormSchema = {
      config: {
        counters: [],
        can_view: countersPlugin?.config.can_view || false,
        can_edit: countersPlugin?.config.can_edit || false,
        can_reset_all: countersPlugin?.config.can_reset_all || false,
      },
      overrides:
        (countersPlugin?.overrides as CountersFormSchema["overrides"]) || [],
    };

    if (!countersPlugin) {
      return null;
    }

    for (const counterName in countersPlugin.config.counters) {
      const counter = countersPlugin.config.counters[counterName];

      if (!counter) continue;

      convertedCounters.config.counters.push({
        name: counterName,
        counter: {
          per_channel: counter.per_channel,
          per_user: counter.per_user,
          initial_value: counter.initial_value,
          decay: counter.decay || { amount: 0, interval: "0s" },
          triggers: Object.entries(counter.triggers).map(
            ([triggerName, triggerData]) => ({
              name: triggerName,
              data: triggerData,
            }),
          ),
        },
      });
    }

    return convertedCounters;
  }),
  set: guildProcedure
    .input(countersFormSchema)
    .mutation(async ({ ctx, input }) => {
      const counterConversion: z.infer<typeof countersSchema> = {
        config: {
          counters: {},
          can_view: input.config.can_view,
          can_edit: input.config.can_edit,
          can_reset_all: input.config.can_reset_all,
        },
        overrides: input.overrides,
      };

      for (const counter of input.config.counters) {
        const triggers: z.infer<typeof baseCounterObjectSchema.shape.triggers> =
          {};

        for (const trigger of counter.counter.triggers) {
          triggers[trigger.name] = trigger.data;
        }

        counterConversion.config.counters[counter.name] = {
          per_channel: counter.counter.per_channel,
          per_user: counter.counter.per_user,
          initial_value: counter.counter.initial_value,
          decay:
            counter.counter.decay.amount === 0 ||
            counter.counter.decay.interval === "0s"
              ? undefined
              : counter.counter.decay,
          triggers,
        };
      }

      const updatedCounters =
        await countersSchema.safeParseAsync(counterConversion);

      if (!updatedCounters.success) {
        return {
          success: false,
          message: "Invalid counters configuration",
          error: z.treeifyError(updatedCounters.error),
        };
      }

      const botConfigParse = await botConfigSchema.safeParseAsync({
        ...ctx.guild.settings,
        plugins: {
          ...ctx.guild.settings.plugins,
          counters: updatedCounters.data,
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
        message: "Counters configuration updated successfully",
        data: updatedCounters.data?.config,
      };
    }),
});

export default guildCountersRouter;
