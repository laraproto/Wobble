import { type BaseAutomodRuleObjectSchema } from "#/types/modules";
import { GuildMember, Guild } from "discord.js";
import { client } from "#botBase";

// TODO: Implement automod actions
export async function handleAutomodActions(
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

  await userAutomodActions(actions, user, guild);
}

async function userAutomodActions(
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
        // Not implemented yet
        break;
      }
      case "mute": {
        const muteAction = action as NonNullable<typeof actions.mute>;

        // Need to handlebars the template and set up cases system
        await user.timeout(
          muteAction.duration_seconds * 1000,
          muteAction.reason,
        );

        break;
      }
    }
  }
}
