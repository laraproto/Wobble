import type { BotCommand } from "#botBase";

import get_counter from "./get_counter";
import reset_counters from "./reset_counters";
import set_counter from "./set_counter";

export default [get_counter, reset_counters, set_counter] as BotCommand[];
