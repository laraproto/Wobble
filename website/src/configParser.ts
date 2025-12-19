import { levelParsingRegex, type ConfigValidatorSchema } from "./types/modules";

export async function parseLevelCondition(
  condition: string,
  userLevel: number,
): Promise<boolean> {
  const result = levelParsingRegex.exec(condition);

  if (!result || !result[1] || !result[2]) {
    return false;
  }

  switch (result[1]) {
    case ">":
      return userLevel > parseInt(result[2], 10);
    case ">=":
      return userLevel >= parseInt(result[2], 10);
    case "<":
      return userLevel < parseInt(result[2], 10);
    case "<=":
      return userLevel <= parseInt(result[2], 10);
    case "=":
      return userLevel === parseInt(result[2], 10);
    default:
      return userLevel === parseInt(result[2], 10);
  }
}

export async function parseConfig<T>(
  config: ConfigValidatorSchema & { config: T },
  userLevel: number,
): Promise<T> {
  if (!config.overrides) {
    return config.config;
  }

  let finalConfig = { ...config.config };
  for (const override of config.overrides) {
    const levelMatch = await parseLevelCondition(override.level, userLevel);

    if (levelMatch) {
      finalConfig = {
        ...finalConfig,
        ...override.config,
      };
    }
  }

  return finalConfig;
}
