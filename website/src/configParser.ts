import {
  operationParsingRegex,
  type ConfigValidatorSchema,
} from "./types/modules";

export async function parseNumberCondition(
  condition: string,
  numberInput: number,
): Promise<boolean> {
  const result = operationParsingRegex.exec(condition);

  if (!result || !result[1] || !result[2]) {
    return false;
  }

  switch (result[1]) {
    case ">":
      return numberInput > parseInt(result[2], 10);
    case ">=":
      return numberInput >= parseInt(result[2], 10);
    case "<":
      return numberInput < parseInt(result[2], 10);
    case "<=":
      return numberInput <= parseInt(result[2], 10);
    case "=":
      return numberInput === parseInt(result[2], 10);
    default:
      return numberInput === parseInt(result[2], 10);
  }
}

export async function parseConfig<T extends ConfigValidatorSchema["config"]>(
  config: ConfigValidatorSchema,
  userLevel: number,
): Promise<T> {
  if (!config.overrides) {
    return config.config;
  }

  let finalConfig = { ...config.config };
  for (const override of config.overrides) {
    const levelMatch = await parseNumberCondition(override.level, userLevel);

    if (levelMatch) {
      finalConfig = {
        ...finalConfig,
        ...override.config,
      };
    }
  }

  return finalConfig;
}
