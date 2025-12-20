import { sendEvent } from "#routes/websocket/index.ts";
import { type Snowflake } from "#/types/discord";
import {
  type BotConfigSchema,
  type PluginsList,
  type BaseCountersSchema,
  type BaseCounterObjectSchema,
} from "#/types/modules";
import { db, schema } from "../db";
import { eq, and } from "drizzle-orm";

export async function applyGuildSettings(
  guildId: Snowflake,
  settings: BotConfigSchema,
) {
  const oldGuildData = await db.query.guild.findFirst({
    where: eq(schema.guild.guildId, guildId),
  });

  if (!oldGuildData) return null;

  const guildUpdateResult = await db
    .update(schema.guild)
    .set({
      settings: settings,
    })
    .where(eq(schema.guild.guildId, guildId))
    .returning();

  if (settings.plugins) {
    await applyPlugins(
      oldGuildData.uuid,
      oldGuildData.settings.plugins,
      settings.plugins,
    );
  }

  if (!guildUpdateResult[0]) return null;

  await sendEvent("guildRefetch", { guildId: guildId });

  return guildUpdateResult[0];
}

export async function applyPlugins(
  guildId: string,
  oldPlugins: BotConfigSchema["plugins"],
  plugins: BotConfigSchema["plugins"],
) {
  for await (const pluginName of Object.keys(plugins)) {
    console.log(`Processing changes for ${pluginName}`);
    const typedPluginName: PluginsList = pluginName as PluginsList;
    switch (pluginName) {
      case "counters": {
        const pluginData: BotConfigSchema["plugins"]["counters"] = plugins[
          typedPluginName
        ] as BotConfigSchema["plugins"]["counters"];
        const oldPluginData: BotConfigSchema["plugins"]["counters"] =
          oldPlugins[typedPluginName] as BotConfigSchema["plugins"]["counters"];
        if (!pluginData) {
          console.log("No counters plugin data to apply or no old data");
          deleteCountersIfAny(guildId);
          break;
        }
        if (oldPluginData?.config.counters === pluginData.config.counters) {
          console.log("No changes in counters config");
          break;
        }
        await applyCounters(
          guildId,
          pluginData.config.counters,
          oldPluginData?.config.counters || undefined,
        );
        break;
      }
      default: {
        console.log(`No apply logic for plugin: ${pluginName}`);
        continue;
      }
    }
  }
}

export async function applyCounters(
  guildId: Snowflake,
  counters: BaseCountersSchema["counters"],
  oldCounters?: BaseCountersSchema["counters"],
) {
  const newCounterNames = Object.keys(counters);
  if (oldCounters) {
    const oldCounterNames = Object.keys(oldCounters);
    for await (const oldCounter of oldCounterNames) {
      if (!newCounterNames.includes(oldCounter)) {
        console.log(`Deleting counter: ${oldCounter}`);
        await db
          .delete(schema.guildCounters)
          .where(
            and(
              eq(schema.guildCounters.guildId, guildId),
              eq(schema.guildCounters.counterName, oldCounter),
            ),
          );
      }
    }
  }
  for await (const counterName of newCounterNames) {
    // Old counter used to update existing if one does exist
    if (oldCounters) {
      const oldCounter = oldCounters[counterName];

      if (oldCounter) {
        const counterInDb = await db.query.guildCounters.findFirst({
          where: eq(schema.guildCounters.counterName, counterName),
        });
        handleOldCounter(
          guildId,
          oldCounter,
          counters[counterName]!,
          counterName,
          counterInDb!,
        );
        continue;
      }
    }

    console.log(`Inserting new counter: ${counterName}`);

    const insertResult = await db
      .insert(schema.guildCounters)
      .values({
        guildId: guildId,
        initialValue: counters[counterName]!.initial_value,
        counterName: counterName,
        perUser: counters[counterName]!.per_user,
        perChannel: counters[counterName]!.per_channel,
      })
      .returning();

    if (!insertResult[0]) {
      console.log(`Failed to insert counter: ${counterName}`);
      continue;
    }

    await handleNewCounter(
      guildId,
      counters[counterName]!,
      counterName,
      insertResult[0],
    );
  }
}

export async function handleOldCounter(
  guildId: Snowflake,
  oldCounter: BaseCounterObjectSchema,
  counter: BaseCounterObjectSchema,
  counterName: string,
  counterDb: schema.GuildCounter,
) {
  const triggerNames = Object.keys(oldCounter.triggers);
  for await (const trigger of triggerNames) {
    const oldTrigger = oldCounter.triggers[trigger];
    const newTrigger = counter.triggers[trigger];
    if (!newTrigger) {
      console.log(`Deleting trigger: ${trigger} from counter ${counterName}`);

      await db
        .delete(schema.guildCounterTriggers)
        .where(and(eq(schema.guildCounterTriggers.counterId, counterDb.uuid)));
    }

    if (oldTrigger && newTrigger) {
      if (oldTrigger.condition !== newTrigger.condition) {
        console.log(
          `Updating trigger: ${trigger} condition for counter ${counterName}`,
        );
        await db
          .update(schema.guildCounterTriggers)
          .set({
            triggerCondition: newTrigger.condition,
          })
          .where(
            and(
              eq(schema.guildCounterTriggers.counterId, counterDb.uuid),
              eq(schema.guildCounterTriggers.triggerName, trigger),
            ),
          );
      }
    }
  }

  if (oldCounter.initial_value !== counter.initial_value) {
    console.log(`Updating counter: ${counterName} initial value`);
    await db
      .update(schema.guildCounters)
      .set({
        initialValue: counter.initial_value,
      })
      .where(eq(schema.guildCounters.uuid, counterDb.uuid));
  }
}

export async function handleNewCounter(
  guildId: Snowflake,
  counter: BaseCounterObjectSchema,
  counterName: string,
  counterDb: schema.GuildCounter,
) {
  const triggerNames = Object.keys(counter.triggers);
  for await (const trigger of triggerNames) {
    console.log(`Inserting new trigger: ${trigger} for counter ${counterName}`);

    await db.insert(schema.guildCounterTriggers).values({
      counterId: counterDb.uuid,
      triggerName: trigger,
      triggerCondition: counter.triggers[trigger]!.condition,
    });
  }
}

export async function deleteCountersIfAny(guildId: Snowflake) {
  await db
    .delete(schema.guildCounters)
    .where(eq(schema.guildCounters.guildId, guildId));
}
