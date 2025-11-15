import {
  pgTable,
  varchar,
  timestamp,
  text,
  bigint,
  boolean,
  uuid,
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
