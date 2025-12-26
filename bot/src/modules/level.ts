import type { BotConfigSchema } from "#/types/modules";
import { client } from "#botBase";
import type { Snowflake } from "discord.js";

export async function checkLevel(
  guildSettings: BotConfigSchema,
  guildId: Snowflake,
  userId: Snowflake,
): Promise<number> {
  if (!guildSettings) return 0;

  if (!guildSettings.levels) return 0;

  const guild = client.guilds.cache.get(guildId);

  const userLevel = guildSettings.levels[userId];

  if (!guild) return userLevel ?? 0;

  const member = await guild.members.fetch(userId).catch(() => null);

  if (!member) return userLevel ?? 0;
  let highestRoleLevel = 0;
  for (const roleId of member.roles.cache.keys()) {
    const roleLevel = guildSettings.levels[roleId];
    if (roleLevel && roleLevel > highestRoleLevel) {
      highestRoleLevel = roleLevel;
    }
  }

  return Math.max(userLevel ?? 0, highestRoleLevel);
}
