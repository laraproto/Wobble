import { createMiddleware } from "hono/factory";
import { getCookie, setCookie } from "hono/cookie";
import * as auth from "@modules/auth";
import type { UserMinimal, Session } from "@modules/db/schema";
import { db } from "@modules/db";

const sessionMiddleware = createMiddleware<{
  Variables: {
    session: Session | null;
    user: UserMinimal | null;
  };
}>(async (c, next) => {
  if (!db) {
    console.log("[sessionHandler] Installer Wizard not completed");
    await next();
    return;
  }

  const authCookie = getCookie(c, "session");

  let authSession: Session | null = null;
  let user: UserMinimal | null = null;

  if (authCookie !== undefined) {
    const validation = await auth.validateSessionToken(authCookie);

    authSession = validation.session;
    user = validation.user;
  } else {
    const sessionToken = auth.generateSessionToken();
    const newSession = await auth.createSession(sessionToken);
    authSession = newSession;
    setCookie(c, "session", sessionToken);
  }

  c.set("session", authSession);
  if (user) c.set("user", user);

  await next();
  return;
});
