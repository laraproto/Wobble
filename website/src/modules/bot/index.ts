import { installerConfig } from "#modules/installer";

declare const EXECUTABLE: boolean;

export const startBotChildProcess = async (url: URL, basePath: string) => {
  if (!installerConfig) {
    return false;
  }

  let proc: Bun.Subprocess<"ignore", "inherit", "inherit"> | null = null;
  console.log("About to create discord bot");
  if (EXECUTABLE) {
    proc = Bun.spawn([process.execPath, "bot"], {
      env: {
        ...process.env,
        BOT_TOKEN: installerConfig.bot_token,
        URL: url.toString(),
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
      },
      stdout: "inherit",
      stderr: "inherit",
    });
  }

  proc.unref();

  if (proc.exitCode) {
    return false;
  }

  return true;
};
