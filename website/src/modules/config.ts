import os from "node:os";
import path from "node:path";
import * as fs from "node:fs";

const isUndefinedOrEmpty = (
  value: string | undefined,
  replace_value?: string,
) => {
  if (value === undefined || value.trim() === "") {
    return replace_value;
  }
  return value;
};

export const PORT = Number(isUndefinedOrEmpty(Bun.env.PORT, "3000"));

export const NODE_ENV = isUndefinedOrEmpty(Bun.env.NODE_ENV, "development");

export const DATA_DIR = (() => {
  if (isUndefinedOrEmpty(Bun.env.DATA_DIR)) {
    fs.mkdirSync(Bun.env.DATA_DIR, { recursive: true });
    return Bun.env.DATA_DIR;
  }
  switch (process.platform) {
    case "cygwin":
    case "win32": {
      const appData =
        process.env.APPDATA || path.join(os.homedir(), "AppData/Roaming");
      const data_dir = path.join(appData, "WobbleBot");
      fs.mkdirSync(data_dir, { recursive: true });
      return data_dir;
    }
    case "darwin":
    case "linux": {
      const homeDir = os.homedir();
      const data_dir = path.join(homeDir, ".config/WobbleBot");
      fs.mkdirSync(data_dir, { recursive: true });
      return data_dir;
    }
    default: {
      throw new Error(`Unsupported platform: ${process.platform}`);
    }
  }
})();

export const pgliteDir = path.join(DATA_DIR, "pglite");
