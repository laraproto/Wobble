import type { BotCommand } from "#botBase";
import ping from "./ping";
import level from "./level";

export default [ping, level] as BotCommand[];
