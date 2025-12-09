import { serve } from "bun";
import index from "./index.html" with { type: "html" };
import { PORT } from "./modules/config";
import { installerConfig } from "./modules/installer";

declare const EXECUTABLE: boolean;

const apiInit = async () => {
  const routes = await import("#routes/index");

  const server = serve({
    routes: {
      // Serve index.html for all unmatched routes.
      "/*": index,

      "/api/*": routes.default.fetch,
    },

    development: process.env.NODE_ENV !== "production" && {
      // Enable browser hot reloading in development
      hmr: true,

      // Echo console logs from the browser to the server
      console: true,
    },
    port: PORT,
  });

  console.log(`🚀 Server running at ${server.url}`);

  if (!installerConfig) {
    return;
  }

  if (EXECUTABLE) {
    const proc = Bun.spawn([process.execPath, "bot"], {
      env: {
        ...process.env,
        BOT_TOKEN: installerConfig.bot_token,
        URL: server.url.toString(),
      },
      stdout: "inherit",
      stderr: "inherit",
    });
    proc.unref();
  } else {
    console.log("About to create discord bot");
    const proc = Bun.spawn([process.execPath, import.meta.path, "bot"], {
      env: {
        ...process.env,
        BOT_TOKEN: installerConfig.bot_token,
        URL: server.url.toString(),
      },
      stdout: "inherit",
      stderr: "inherit",
    });
    proc.unref();
  }
};

switch (process.argv[2] === "bot") {
  case true:
    const { botInit } = await import("@wobble/bot");
    if (await botInit()) {
      console.log("🤖 Bot initialized successfully.");
    }
    break;
  default:
    await apiInit();
    break;
}
