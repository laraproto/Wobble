import { createMiddleware } from "hono/factory";
import { getCookie, setCookie } from "hono/cookie";
import * as auth from "#modules/auth";
import type { UserMinimal, Session, User } from "#modules/db/schema";
import { db, schema } from "#modules/db";
import { eq } from "drizzle-orm";
import { discord } from "#/modules/oauth";
import { botSessionKey } from "#/modules/bot";

const sessionMiddleware = createMiddleware<{
  Variables: {
    session: Session | null;
    user: UserMinimal | null;
    userUnredacted: User | null;
    isBot: boolean | null;
  };
}>(async (c, next) => {
  if (!db) {
    console.log("[sessionHandler] Installer Wizard not completed");
    await next();
    return;
  }

  const authHeader = c.req.header("Authorization");
  const authCookie = getCookie(c, "session");

  let authSession: Session | null = null;
  let user: UserMinimal | null = null;
  let userUnredacted: User | null = null;

  if (authHeader && authHeader === botSessionKey) {
    c.set("isBot", true);
    await next();
    return;
  } else {
    c.set("isBot", false);
  }

  if (authCookie !== undefined) {
    const validation = await auth.validateSessionToken(authCookie);

    authSession = validation.session;
    user = validation.user;
    userUnredacted = validation.userUnredacted;
  } else {
    const sessionToken = auth.generateSessionToken();
    const newSession = await auth.createSession(sessionToken);
    authSession = newSession;
    setCookie(c, "session", sessionToken, {
      expires: new Date(Date.now() + auth.DAY_IN_MS),
    });
  }

  if (authSession === null) {
    const sessionToken = auth.generateSessionToken();
    const newSession = await auth.createSession(sessionToken);
    authSession = newSession;
    setCookie(c, "session", sessionToken, {
      expires: new Date(Date.now() + auth.DAY_IN_MS),
      sameSite: "Strict",
    });
  }

  c.set("session", authSession);
  if (user) c.set("user", user);

  const expiresSeconds = authSession.expiresAt.getTime() - Date.now();
  if (authCookie && user && expiresSeconds < auth.DAY_IN_MS * 7) {
    const newExpiresAt = new Date(Date.now() + auth.DAY_IN_MS * 30);
    setCookie(c, "session", authCookie, {
      expires: newExpiresAt,
      sameSite: "Strict",
    });
  }

  if (authCookie && user && userUnredacted) {
    c.set("userUnredacted", userUnredacted);

    if (userUnredacted.tokenExpiresAt.getTime() < Date.now()) {
      if (!discord) {
        console.log("[sessionMiddleware] Discord OAuth not configured");
        await next();
        return;
      }

      const tokens = await discord.refreshAccessToken(
        userUnredacted.refreshToken,
      );

      await db
        .update(schema.user)
        .set({
          accessToken: tokens.accessToken(),
          refreshToken: tokens.refreshToken(),
          tokenExpiresAt: tokens.accessTokenExpiresAt(),
        })
        .where(eq(schema.user.uuid, userUnredacted.uuid));
    }
  }

  await next();
  return;
});

export default sessionMiddleware;
