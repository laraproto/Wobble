import { z } from "zod";
import { zodSnowflake } from "./discord";

export const pluginsSchema = z.object({});

export const botConfigSchema = z.object({
  levels: z.record(zodSnowflake, z.number().min(0).max(100)),

  plugins: pluginsSchema,
});

export {};
