import type { BotCommand } from "#botBase";
import kick from "./kick";
import ban from "./ban";
import unban from "./unban";
import addcase from "./addcase";
import note from "./note";
import warn from "./warn";

export default [kick, ban, unban, addcase, note, warn] as BotCommand[];
