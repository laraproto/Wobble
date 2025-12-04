import {
  pgTable,
  varchar,
  timestamp,
  text,
  bigint,
  boolean,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { z } from "zod";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";

const timeData = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).$onUpdateFn(() => new Date()),
};

export const user = pgTable("users", {
  uuid: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 256 }).notNull().unique(),
  displayName: varchar("display_name", { length: 128 }).notNull(),
  discordId: varchar("discord_id", { length: 256 }).notNull().unique(),
  totpSecret: varchar("totp_secret", { length: 64 }),
  avatarHash: varchar("avatar_hash", { length: 256 }),
  flags: bigint({ mode: "bigint" })
    .notNull()
    .default(sql`1::bigint`),
  ...timeData,
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: uuid("user_id").references(() => user.uuid, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  totpVerified: boolean("totp_verified").notNull().default(false),
  ...timeData,
});

export const guild = pgTable("guilds", {
  uuid: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 256 }).notNull(),
  guildId: varchar("guild_id", { length: 256 }).notNull().unique(),
  iconHash: varchar("icon_hash", { length: 256 }),
  ownerId: varchar("owner_id", { length: 256 })
    .references(() => user.discordId, { onDelete: "cascade" })
    .notNull(),
  settings: jsonb("settings")
    .notNull()
    .default(sql`'{}'::jsonb`),
  ...timeData,
});

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.uuid],
  }),
}));

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
}));

export const userSelectSchema = createSelectSchema(user);
export const userInsertSchema = createInsertSchema(user);

export const sessionSelectSchema = createSelectSchema(session);
export const sessionInsertSchema = createInsertSchema(session);

export const userSelectMinimal = userSelectSchema.omit({
  totpSecret: true,
});

export const userSelectMinimalWithSessions = z.object({
  ...userSelectMinimal.shape,
  sessions: z.array(sessionSelectSchema),
});

export const userSelectWithSessions = z.object({
  ...userSelectSchema.shape,
  sessions: z.array(sessionSelectSchema),
});

export type User = z.infer<typeof userSelectSchema>;
export type UserMinimal = z.infer<typeof userSelectMinimal>;
export type UserMinimalWithSessions = z.infer<
  typeof userSelectMinimalWithSessions
>;
export type UserWithSessions = z.infer<typeof userSelectWithSessions>;

export type Session = z.infer<typeof sessionSelectSchema>;
export type SessionInsert = z.infer<typeof sessionInsertSchema>;
export type UserInsert = z.infer<typeof userInsertSchema>;
