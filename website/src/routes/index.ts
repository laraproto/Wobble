import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "@routes/trpc/index";

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
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
  }),
);

export default app;
