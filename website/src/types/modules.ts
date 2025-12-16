import { z } from "zod";
import { zodSnowflake } from "./discord";

export const moduleSchema = z.object({
  levels: z.record(zodSnowflake, z.number().min(0).max(100)),
});

export {};
