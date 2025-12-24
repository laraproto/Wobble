import cron from "node-cron";
import { db, schema } from "../db";
import { eq, isNotNull, and, lte } from "drizzle-orm";
import { makeDuration } from "#/configParser";
import { sendEvent } from "#routes/websocket/index.ts";
import type { UnbanEvent } from "#/types/ws";

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

cron.schedule("* * * * *", async () => {
  const bans = await db.query.guildBan.findMany({
    where: and(
      isNotNull(schema.guildBan.expiresAt),
      lte(schema.guildBan.expiresAt, new Date()),
    ),
  });

  for await (const ban of bans) {
    try {
      const banDelete = await db
        .delete(schema.guildBan)
        .where(eq(schema.guildBan.uuid, ban.uuid))
        .returning();

      if (banDelete.length === 0) {
        console.error(
          `Failed to delete ban record for user ${ban.targetId} from guild ${ban.guildId}`,
        );
        continue;
      }

      const guild = await db.query.guild.findFirst({
        where: eq(schema.guild.uuid, ban.guildId),
      });

      if (!guild) {
        console.log("This should not be possible!!!!");
        continue;
      }

      await sendEvent("guildUnban", {
        guild_id: guild.guildId,
        user_id: ban.targetId,
        creator_id: undefined,
        reason: `${ban.reason} (Automatic ban expiry)`,
      } as UnbanEvent);

      console.log(
        `Ending ban for user ${ban.targetId} from guild ${ban.guildId}`,
      );
    } catch (err) {
      console.error(
        `Failed to unban user ${ban.targetId} from guild ${ban.guildId}:`,
        err,
      );
      continue;
    }
  }
});
