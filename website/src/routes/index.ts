import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import sessionMiddleware from "#middleware/sessionMiddleware";
import { appRouter } from "#routes/trpc/index";
import authApp from "./auth";

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

app.route("", authApp);

app.use(
  "/trpc/*",
  sessionMiddleware,
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext: (_opts, c) => ({
      session: c.get("session"),
      user: c.get("user"),
      userUnredacted: c.get("userUnredacted"),
    }),
  }),
);

export default app;
