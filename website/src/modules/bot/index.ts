import { installerConfig } from "#modules/installer";
import { generateSessionToken } from "../auth";

declare const EXECUTABLE: boolean;

export const botSessionKey = generateSessionToken();

export const startBotChildProcess = async (url: URL, basePath: string) => {
  if (!installerConfig) {
    return false;
  }

  if (global.botGlobal) {
    console.log("Bot running, time to kill");
    global.botGlobal.kill(9);
  }

  let proc: Bun.Subprocess<"ignore", "inherit", "inherit"> | null = null;
  console.log("About to create discord bot");
  if (EXECUTABLE) {
    proc = Bun.spawn([process.execPath, "bot"], {
      env: {
        ...process.env,
        BOT_TOKEN: installerConfig.bot_token,
        URL: url.toString(),
        BOT_SESSION: botSessionKey,
      },
      stdout: "inherit",
      stderr: "inherit",
    });
  } else {
    proc = Bun.spawn([process.execPath, basePath, "bot"], {
      env: {
        ...process.env,
        BOT_TOKEN: installerConfig.bot_token,
        URL: url.toString(),
        BOT_SESSION: botSessionKey,
      },
      stdout: "inherit",
      stderr: "inherit",
    });
  }

  proc.unref();

  if (proc.exitCode) {
    return false;
  }

  global.botGlobal = proc;

  return true;
};
