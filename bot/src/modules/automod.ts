import { type BaseAutomodRuleObjectSchema } from "#/types/modules";
import { GuildMember, Guild } from "discord.js";
import { client } from "#botBase";
import handlebars from "handlebars";
import { createCase } from "./cases";
import { checkLevel } from "./level";
import { parseConfig } from "@wobble/website/configParser";
import trpc from "#botModules/trpc";

export async function discordAutomodTrigger(
  ruleId: string,
  guildId: string,
  userId: string,
) {
  const guildSettings = client.guildConfig!.get(guildId);

  if (!guildSettings) return;

  if (!guildSettings.plugins.automod?.config.rules) return;

  const level = await checkLevel(guildSettings, guildId, userId);

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

    for await (const triggerConfig of ruleConfig.triggers) {
      if (!triggerConfig.automod_trigger) {
        continue;
      }

      if (triggerConfig.automod_trigger.ruleId !== ruleId) {
        continue;
      }

      console.log(
        `Triggering automod actions on ${rule} because of automod_trigger event from rule ID ${ruleId}`,
      );
      await handleAutomodActions(rule, ruleConfig.actions, userId, guildId);
    }
  }
}

// TODO: Implement automod actions
export async function handleAutomodActions(
  ruleName: string,
  actions: BaseAutomodRuleObjectSchema["actions"],
  userId?: string,
  guildId?: string,
) {
  if (!actions) {
    return;
  }

  if (!guildId) {
    // Automod rules are guild only
    return;
  }

  const guild = await client.guilds.fetch(guildId);

  if (!guild) {
    // Guild not found
    return;
  }

  // Current automod rules only support actions targetted to users, need to make it support channel or global counters, to say lock or slowmode a channel

  if (!userId) {
    return;
  }

  const user = await guild.members.fetch(userId);

  if (user) {
    await userAutomodActions(ruleName, actions, user, guild);
  }
}

async function userAutomodActions(
  ruleName: string,
  actions: BaseAutomodRuleObjectSchema["actions"],
  user: GuildMember,
  guild: Guild,
) {
  if (!actions) {
    return;
  }

  const actionKeys = Object.keys(actions) as (keyof typeof actions)[];

  for await (const actionKey of actionKeys) {
    const action = actions[actionKey];

    console.log(`Processing action: ${actionKey}`);

    // This is guaranteed to exist but make typescript happy
    if (!action) return;

    switch (actionKey) {
      case "warn": {
        const warnAction = action as NonNullable<typeof actions.warn>;

        const handlebarsTemplate = handlebars.compile(warnAction.reason, {
          noEscape: true,
        });

        const reason = handlebarsTemplate({
          ruleName,
        });

        createCase({
          guildId: guild.id,
          caseType: "warn",
          targetId: user.id,
          creatorId: null,
          reason,
        });

        break;
      }
      case "mute": {
        const muteAction = action as NonNullable<typeof actions.mute>;

        const handlebarsTemplate = handlebars.compile(muteAction.reason, {
          noEscape: true,
        });

        const reason = handlebarsTemplate({
          ruleName,
        });

        createCase({
          guildId: guild.id,
          caseType: "mute",
          targetId: user.id,
          creatorId: null,
          reason,
        });

        await user.timeout(
          muteAction.duration_seconds * 1000,
          muteAction.reason,
        );

        break;
      }
      case "add_counter": {
        const addCounterAction = action as NonNullable<
          typeof actions.add_counter
        >;

        await trpc.bot.plugins.counters.incrementCounter.mutate({
          guildId: guild.id,
          counterName: addCounterAction.counter,
          value: addCounterAction.value,
          user_id: user.id,
          channel_id: undefined,
        });
      }
    }
  }
}
