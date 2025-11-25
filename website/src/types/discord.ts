import z from "zod";

export const snowflakeRegex = /[1-9][0-9]{5,19}/;

export const zodSnowflake = z
  .string()
  .regex(snowflakeRegex, "Invalid snowflake");
