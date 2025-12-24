import type { BotCommand } from "#botBase";
import kick from "./kick";
import ban from "./ban";
import unban from "./unban";
import addcase from "./addcase";
import note from "./note";
import warn from "./warn";
import cases from "./cases";
import editcase from "./editcase";
import deletecase from "./deletecase";
import mute from "./mute";
import unmute from "./unmute";

export default [
  kick,
  ban,
  unban,
  addcase,
  note,
  warn,
  cases,
  editcase,
  deletecase,
  mute,
  unmute,
] as BotCommand[];
