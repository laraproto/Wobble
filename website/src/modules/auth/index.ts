import { eq } from "drizzle-orm";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase64url, encodeHexLowerCase } from "@oslojs/encoding";
import { db, schema } from "#modules/db";

export const DAY_IN_MS = 1000 * 60 * 60 * 24;

export function generateSessionToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  const token = encodeBase64url(bytes);
  return token;
}

export async function setSessionUser(sessionId: string, userId: string) {
  await db
    .update(schema.session)
    .set({ userId, expiresAt: new Date(Date.now() + DAY_IN_MS * 30) })
    .where(eq(schema.session.id, sessionId));
}

export async function createSession(token: string, userId?: string) {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const session: schema.SessionInsert & {
    createdAt: Date;
    updatedAt: Date | null;
    userId: string | null;
    totpVerified: boolean;
  } = {
    id: sessionId,
    createdAt: new Date(),
    updatedAt: null,
    userId: null,
    expiresAt: new Date(Date.now() + DAY_IN_MS * 1),
    totpVerified: false,
  };
  if (userId) {
    session.userId = userId;
  }
  await db.insert(schema.session).values(session);
  return session;
}

export async function validateSessionToken(token: string) {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const result = await db.query.session.findFirst({
    where: (sessionTable, { eq }) => eq(sessionTable.id, sessionId),
  });

  if (!result) {
    return { session: null, user: null };
  }
  const session = result;

  let userQuery;

  if (session.userId !== null) {
    userQuery = await db.query.user.findFirst({
      //@ts-expect-error typescript is being drunk, i am null checking userId but it still complains
      where: (userTable, { eq }) => eq(userTable.uuid, session.userId),
    });
  }

  const user = schema.userSelectMinimal.safeParse(userQuery).data ?? null;

  const sessionExpired = Date.now() >= session.expiresAt.getTime();
  if (sessionExpired) {
    await db.delete(schema.session).where(eq(schema.session.id, session.id));
    return { session: null, user: null };
  }

  const renewSession =
    Date.now() >= session.expiresAt.getTime() - DAY_IN_MS * 15 &&
    session.userId !== null;
  if (renewSession) {
    if (session.userId)
      session.expiresAt = new Date(Date.now() + DAY_IN_MS * 30);
    await db
      .update(schema.session)
      .set({ expiresAt: session.expiresAt })
      .where(eq(schema.session.id, session.id));
  }

  return { session, user };
}

export type SessionValidationResult = Awaited<
  ReturnType<typeof validateSessionToken>
>;

export async function invalidateSession(sessionId: string) {
  const sessionReturned = await db
    .delete(schema.session)
    .where(eq(schema.session.id, sessionId))
    .returning();
  return sessionReturned !== null;
}

export async function invalidateAllSessionsForUser(userId: string) {
  const sessionReturned = await db
    .delete(schema.session)
    .where(eq(schema.session.userId, userId))
    .returning();
  return sessionReturned === null;
}
