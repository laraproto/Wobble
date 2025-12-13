import { Hono } from "hono";
import sessionMiddleware from "#middleware/sessionMiddleware";
import * as arctic from "arctic";
import { discord, discordScopes } from "#modules/oauth";
import type { APIUser } from "discord-api-types/v10";
import { setCookie, getCookie } from "hono/cookie";
import { db, schema } from "#modules/db";
import { setSessionUser } from "#modules/auth";
import { discordKy } from "#/kyInstance";

type Variables = {
  session: schema.Session | null;
  user: schema.UserMinimal | null;
};

const authApp = new Hono<{ Variables: Variables }>().basePath("/auth");

authApp.use(sessionMiddleware);

authApp.get("/redirect", async (c) => {
  if (!c.get("session")) {
    return c.text("Session not found", 400);
  }

  if (c.get("user")) {
    return c.redirect("/dashboard", 307);
  }

  if (!discord) {
    return c.text("Complete installer first", 400);
  }

  const state = arctic.generateState();
  const url = discord.createAuthorizationURL(state, null, discordScopes);
  setCookie(c, "discord_state", state, {
    secure: true,
    httpOnly: true,
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });
  return c.redirect(url, 307);
});

authApp.get("/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const permissions = c.req.query("permissions");
  const guildId = c.req.query("guild_id");

  const storedState = getCookie(c, "discord_state");

  if (!c.get("session")) {
    return c.text("Session not found", 400);
  }

  if (!discord) {
    return c.text("Complete installer first", 400);
  }

  if (
    code === undefined ||
    storedState === undefined ||
    state !== storedState
  ) {
    console.error("Invalid state or missing code");
    return c.text("Authentication failed", 400);
  }

  if (permissions && guildId && c.get("user")) {
    console.log("Bot invite done");
    const getGuild = await db.query.guild.findFirst({
      where: (guild, { eq }) => eq(guild.guildId, guildId),
    });

    if (!getGuild) {
      console.log("Bot invite happened but guild was still missed");
      return c.text("Guild miss somehow, bot might be offline?", 400);
    }

    return c.redirect(`/dashboard/${getGuild.uuid}/overview`);
  }

  try {
    const tokens = await discord.validateAuthorizationCode(code, null);
    const accessToken = tokens.accessToken();
    const refreshToken = tokens.refreshToken();

    const discordUser = await discordKy("users/@me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }).json<APIUser>();

    const user = await db
      .insert(schema.user)
      .values({
        discordId: discordUser.id,
        username: discordUser.username,
        displayName: discordUser.global_name ?? discordUser.username,
        avatarHash: discordUser.avatar,
        accessToken: accessToken,
        refreshToken: refreshToken,
        tokenExpiresAt: new Date(
          Date.now() + tokens.accessTokenExpiresInSeconds() * 1000,
        ),
      })
      .onConflictDoUpdate({
        target: schema.user.discordId,
        set: {
          username: discordUser.username,
          displayName: discordUser.global_name ?? discordUser.username,
          avatarHash: discordUser.avatar,
          accessToken: accessToken,
          refreshToken: refreshToken,
          tokenExpiresAt: new Date(
            Date.now() + tokens.accessTokenExpiresInSeconds() * 1000,
          ),
        },
      })
      .returning();

    if (!user[0]) {
      console.error("Failed to create or update user");
      return c.text("Failed to create or update user", 500);
    }

    await setSessionUser(c.get("session")!.id, user[0].uuid);

    return c.redirect("/dashboard", 307);
  } catch (e) {
    if (e instanceof arctic.OAuth2RequestError) {
      // Invalid authorization code, credentials, or redirect URI
      const code = e.code;
      return c.text(e.code, 400);
    }
    if (e instanceof arctic.ArcticFetchError) {
      // Failed to call `fetch()`
      const cause = e.cause;
      console.error(e);
      return c.text(e.message ?? "Unknown authentication failure", 500);
    }
    console.error(e);
    return c.text("Authentication failed", 500);
  }
});

export default authApp;
