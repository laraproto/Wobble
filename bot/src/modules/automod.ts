import { type BaseAutomodRuleObjectSchema } from "#/types/modules";
import { GuildMember, Guild, DiscordAPIError } from "discord.js";
import { client } from "#botBase";
import handlebars from "handlebars";
import { createCase } from "./cases";
import { checkLevel } from "./level";
import { makeDuration, parseConfig } from "@wobble/website/configParser";
import trpc from "#botModules/trpc";

export async function discordAutomodTrigger(
  ruleId: string,
  guildId: string,
  userId: string,
) {
  const guildSettings = client.guildConfig!.get(guildId);

  const guildInfo = await trpc.bot.checkGuild.query(guildId);

  if (!guildInfo.guild) return;

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
      await handleAutomodActions(
        rule,
        ruleConfig.actions,
        userId,
        guildId,
        guildInfo.guild.uuid,
      );
    }
  }
}

// TODO: Implement automod actions
export async function handleAutomodActions(
  ruleName: string,
  actions: BaseAutomodRuleObjectSchema["actions"],
  userId?: string,
  guildId?: string,
  guildUUID?: string,
) {
  if (!actions) {
    return;
  }

  if (!guildId) {
    // Automod rules are guild only
    return;
  }

  const guild = await client.guilds.fetch(guildId);

  if (!guild || !guildUUID) {
    // Guild not found
    return;
  }

  // Current automod rules only support actions targetted to users, need to make it support channel or global counters, to say lock or slowmode a channel

  if (!userId) {
    return;
  }

  const user = await guild.members.fetch(userId);

  console.log("About to run automod actions");
  if (user) {
    console.log("Running automod actions for user:", user.user.tag);
    await userAutomodActions(ruleName, actions, user, guild, guildUUID);
  }
}

async function userAutomodActions(
  ruleName: string,
  actions: BaseAutomodRuleObjectSchema["actions"],
  user: GuildMember,
  guild: Guild,
  guildUUID: string,
) {
  if (!actions) {
    return;
  }

  const actionKeys = Object.keys(actions) as (keyof typeof actions)[];

  try {
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

          createCase(
            {
              guildId: guild.id,
              caseType: "warn",
              targetId: user.id,
              creatorId: null,
              reason,
            },
            true,
          );

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

          await createCase(
            {
              guildId: guild.id,
              caseType: "mute",
              targetId: user.id,
              creatorId: null,
              reason,
            },
            true,
          );

          await user.timeout(
            (await makeDuration(muteAction.duration)).asMilliseconds(),
            muteAction.reason,
          );

          break;
        }
        case "kick": {
          const kickAction = action as NonNullable<typeof actions.kick>;

          const handlebarsTemplate = handlebars.compile(kickAction.reason, {
            noEscape: true,
          });

          const reason = handlebarsTemplate({
            ruleName,
          });

          await createCase(
            {
              guildId: guild.id,
              caseType: "kick",
              targetId: user.id,
              creatorId: null,
              reason,
            },
            true,
          );

          await user.kick(kickAction.reason);

          break;
        }
        case "ban": {
          const banAction = action as NonNullable<typeof actions.ban>;

          const handlebarsTemplate = handlebars.compile(banAction.reason, {
            noEscape: true,
          });

          const reason = handlebarsTemplate({
            ruleName,
          });

          const caseResult = await createCase(
            {
              guildId: guild.id,
              caseType: "ban",
              targetId: user.id,
              creatorId: null,
              reason,
            },
            true,
          );

          if (!caseResult || !caseResult.data) return;

          if (banAction.duration) {
            const duration = await makeDuration(banAction.duration);

            const result = await trpc.bot.plugins.modActions.createBan.mutate({
              guildId: guildUUID,
              targetId: user.id,
              caseId: caseResult.data.uuid,
              reason,
              duration: duration.asMilliseconds(),
            });

            if (!result.success) {
              console.log(`Failed to create timed ban: ${result.message}`);
              return;
            }

            await user.ban({
              reason: banAction.reason,
              deleteMessageSeconds: 3600,
            });
          }

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

          break;
        }
        case "remove_counter": {
          const removeCounterAction = action as NonNullable<
            typeof actions.remove_counter
          >;

          await trpc.bot.plugins.counters.decrementCounter.mutate({
            guildId: guild.id,
            counterName: removeCounterAction.counter,
            value: removeCounterAction.value,
            user_id: user.id,
            channel_id: undefined,
          });

          break;
        }
      }
    }
  } catch (err) {
    const discordError = err as DiscordAPIError;

    if (discordError.code === 50013) {
      console.log(
        `Missing Permissions to perform automod action on user ${user.user.tag}`,
      );
      createCase(
        {
          guildId: guild.id,
          caseType: "softban",
          targetId: user.id,
          creatorId: null,
          reason: `!! I CANNOT PERFORM AN ACTION ON ${user.user.tag} MY ROLE MAY BE TOO LOW OR MISSING PERMISSIONS !!`,
        },
        false,
      );
      return;
    }
  }
}
