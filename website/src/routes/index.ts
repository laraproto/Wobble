import { Hono } from "hono";
import { setCookie, getCookie } from "hono/cookie";
import { trpcServer } from "@hono/trpc-server";
import sessionMiddleware from "#middleware/sessionMiddleware";
import { appRouter } from "#routes/trpc/index";
import authApp from "./auth";
import { upgradeWebSocket } from "hono/bun";
import type { ServerWebSocket } from "bun";

const app = new Hono().basePath("/api");

app.all("/hello", (c) => {
  return c.json({
    message: "Hello, world!",
    method: c.req.method,
  });
});

app.all("/hello/:name", (c) => {
  const { name } = c.req.param();
  return c.json({
    message: `Hello, ${name}!`,
    method: c.req.method,
  });
});

app.use(
  "/ws",
  sessionMiddleware,
  upgradeWebSocket((c) => {
    return {
      onOpen(_event, ws) {
        const bunWs = ws.raw as ServerWebSocket;
        if (!c.get("isBot")) {
          ws.close(1003, "The websocket endpoint is only used by bots");
        }
        bunWs.subscribe("bot");
      },
      onClose(_event, ws) {
        const bunWs = ws.raw as ServerWebSocket;
        bunWs.unsubscribe("bot");
      },
    };
  }),
);

app.route("", authApp);

app.use(
  "/trpc/*",
  sessionMiddleware,
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext: (_opts, c) => ({
      isBot: c.get("isBot"),
      session: c.get("session"),
      user: c.get("user"),
      userUnredacted: c.get("userUnredacted"),
      setStateCookie: (state: string) =>
        setCookie(c, "discord_state", state, {
          httpOnly: true,
          secure: true,
          path: "/",
          maxAge: 60 * 10,
        }),
      getStateCookie: () => getCookie(c, "discord_state"),
    }),
  }),
);

export default app;
