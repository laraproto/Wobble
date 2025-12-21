import { type CounterTriggerEvent } from "#/types/ws";
import { client } from "#botBase";
import { handleAutomodActions } from "./automod";
import { parseConfig } from "@wobble/website/configParser";
import { checkLevel } from "./level";

export async function processCounterTrigger(trigger: CounterTriggerEvent) {
  const guildSettings = client.guildConfig!.get(trigger.guild_id);

  if (!guildSettings) return;

  if (!guildSettings.plugins.automod?.config.rules) return;

  if (trigger.per_user && !trigger.user_id) return;

  let level: number | null = null;
  if (trigger.per_user && trigger.user_id) {
    level = await checkLevel(guildSettings, trigger.guild_id, trigger.user_id);
  }

  let automodConfig = guildSettings.plugins.automod.config;

  if (!automodConfig) {
    return;
  }

  if (level) {
    automodConfig = await parseConfig(guildSettings.plugins.automod, level);
  }

  for await (const rule of Object.keys(automodConfig.rules)) {
    const ruleConfig = automodConfig.rules[rule];

    if (!ruleConfig?.enabled) {
      continue;
    }

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
    await handleAutomodActions(
      ruleConfig.actions,
      trigger.user_id,
      trigger.guild_id,
    );
  }
}
