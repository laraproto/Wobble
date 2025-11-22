import { serve } from "bun";
import { installerConfig } from "@modules/installer";
import routes from "@routes/index";
import index from "./index.html" with { type: "html" };
import { generateSessionToken } from "./modules/auth";

if (installerConfig === null && !global.installerPassword)
  global.installerPassword = generateSessionToken();

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/*": routes.fetch,
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);

console.log(`Generated installer password: ${global.installerPassword}`);
