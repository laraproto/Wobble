import { type BaseAutomodRuleObjectSchema } from "#/types/modules";
import { GuildMember, Guild } from "discord.js";
import { client } from "#botBase";
import handlebars from "handlebars";
import { createCase } from "./cases";

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

  console.log("Actions exist");

  if (!guildId) {
    // Automod rules are guild only
    return;
  }

  console.log("Guild ID exists");

  const guild = await client.guilds.fetch(guildId);

  if (!guild) {
    // Guild not found
    return;
  }

  console.log("Guild exists");

  // Current automod rules only support actions targetted to users, need to make it support channel or global counters, to say lock or slowmode a channel

  if (!userId) {
    return;
  }

  console.log("User ID exists");

  const user = await guild.members.fetch(userId);

  if (!user) {
    return;
  }

  console.log("User exists");

  await userAutomodActions(ruleName, actions, user, guild);
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
    }
  }
}
