import cron from "node-cron";
import { db, schema } from "../db";
import { eq, isNotNull, and } from "drizzle-orm";
import { makeDuration } from "#/configParser";

// Counter decay
cron.schedule("* * * * *", async () => {
  const counters = await db.query.guildCounters.findMany({
    where: and(
      isNotNull(schema.guildCounters.decayAmount),
      isNotNull(schema.guildCounters.decayTime),
      isNotNull(schema.guildCounters.lastDecayAt),
    ),
  });

  for await (const counter of counters) {
    const duration = await makeDuration(counter.decayTime!);
    const nextDecay = new Date(
      counter.lastDecayAt!.getTime() + duration.asMilliseconds(),
    );

    const counterValues = await db.query.guildCounterValues.findMany({
      where: eq(schema.guildCounterValues.counterId, counter.uuid),
    });

    if (nextDecay <= new Date()) {
      // Time to decay
      const decayAmount = counter.decayAmount!;

      for await (const counterValue of counterValues) {
        if (counterValue.value === counter.initialValue) continue;

        const newValue = counterValue.value - decayAmount;

        console.log(
          `Decaying for ${counter.counterName} and counter value ${counterValue.uuid}`,
        );

        const minValue = Math.max(counter.initialValue, newValue);

        await db
          .update(schema.guildCounterValues)
          .set({
            value: minValue,
          })
          .where(eq(schema.guildCounterValues.uuid, counterValue.uuid));
      }

      await db
        .update(schema.guildCounters)
        .set({
          lastDecayAt: new Date(),
        })
        .where(eq(schema.guildCounters.uuid, counter.uuid));
    }
  }
});
