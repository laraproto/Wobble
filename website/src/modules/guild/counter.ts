import { db, schema } from "#modules/db";
import { eq } from "drizzle-orm";
import { parseNumberCondition } from "#/configParser";
import { sendEvent } from "#routes/websocket/index.ts";

export async function handleCounterValueChange(
  counterId: string,
  value: number,
) {
  const counter = await db.query.guildCounters.findFirst({
    where: eq(schema.guildCounters.uuid, counterId),
  });

  if (!counter) {
    throw new Error("Counter not found");
  }

  const guild = await db.query.guild.findFirst({
    where: eq(schema.guild.uuid, counter.guildId),
  });

  if (!guild) {
    throw new Error("Guild not found");
  }

  const counterTriggers = await db.query.guildCounterTriggers.findMany({
    where: eq(schema.guildCounterTriggers.counterId, counterId),
  });
  for await (const trigger of counterTriggers) {
    const conditionMet = await parseNumberCondition(
      trigger.triggerCondition,
      value,
    );
    if (conditionMet) {
      console.log(
        `Counter ${counter.counterName} triggered ${trigger.triggerName}`,
      );
      await sendEvent("counterTrigger", {
        counter_id: counter.uuid,
        counter_name: counter.counterName,
        guild_id: guild.guildId,
        trigger_id: trigger.uuid,
        trigger_name: trigger.triggerName,
      });
    }
  }
}
