import type { BotCommand } from "#botBase";
import kick from "./kick";
import ban from "./ban";
import unban from "./unban";

export default [kick, ban, unban] as BotCommand[];
