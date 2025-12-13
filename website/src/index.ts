import { serve } from "bun";
import index from "./index.html" with { type: "html" };
import { PORT } from "./modules/config";
import { installerConfig } from "./modules/installer";
import { websocket, type BunWebSocketData } from "hono/bun";

export let serverUrl: URL | null = null;
export let server: Bun.Server<BunWebSocketData> | null = null;

const apiInit = async () => {
  const routes = await import("#routes/index");

  server = serve({
    routes: {
      // Serve index.html for all unmatched routes.
      "/*": index,

      "/api/*": routes.default.fetch,
    },
    websocket,
    development: process.env.NODE_ENV !== "production" && {
      // Enable browser hot reloading in development
      hmr: true,

      // Echo console logs from the browser to the server
      console: true,
    },
    port: PORT,
  });

  console.log(`🚀 Server running at ${server.url}`);

  serverUrl = server.url;

  if (!installerConfig) {
    return;
  }

  const { startBotChildProcess } = await import("#modules/bot");

  const botStarted = await startBotChildProcess(server.url, Bun.main);

  if (botStarted) console.log("Process fork made");
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
