import { type CounterTriggerEvent } from "#/types/ws";
import { client } from "#botBase";
import { handleAutomodActions } from "./automod";

export async function processCounterTrigger(trigger: CounterTriggerEvent) {
  const guildSettings = client.guildConfig!.get(trigger.guild_id);

  if (!guildSettings) return;

  if (!guildSettings.plugins.automod?.config.rules) return;

  for await (const rule of Object.keys(
    guildSettings.plugins.automod.config.rules,
  )) {
    const ruleConfig = guildSettings.plugins.automod!.config.rules[rule];

    if (!ruleConfig?.triggers.counter_trigger) {
      continue;
    }

    if (
      !(
        ruleConfig.triggers.counter_trigger.counter === trigger.counter_name &&
        ruleConfig.triggers.counter_trigger.trigger === trigger.trigger_name
      )
    ) {
      continue;
    }

    console.log(
      `Triggering automod actions on ${rule} because of counter_trigger event from ${trigger.counter_name} with trigger ${trigger.trigger_name}`,
    );
    await handleAutomodActions(ruleConfig.actions);
  }
}
