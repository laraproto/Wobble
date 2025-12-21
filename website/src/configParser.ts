import {
  operationParsingRegex,
  durationParsingRegex,
  type ConfigValidatorSchema,
} from "./types/modules";

import moment from "moment";

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

export async function parseConfig<T extends ConfigValidatorSchema>(
  config: T,
  userLevel: number,
): Promise<T["config"]> {
  if (!config) {
    throw new Error("No config provided");
  }

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

export async function makeDuration(duration: string) {
  const result = durationParsingRegex.exec(duration);

  if (!result || !result[1] || !result[2]) {
    throw new Error("Invalid duration format");
  }

  const timeValue = parseFloat(result[1]);
  const timeUnit = result[2] as moment.DurationInputArg2;

  return moment.duration(timeValue, timeUnit);
}
