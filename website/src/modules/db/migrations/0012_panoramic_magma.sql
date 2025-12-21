CREATE TYPE "public"."case_enum" AS ENUM('note', 'unban', 'ban', 'warn', 'kick', 'mute', 'unmute', 'softban');--> statement-breakpoint
CREATE TABLE "guild_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"case_type" "case_enum" NOT NULL,
	"creator_id" varchar(256) NOT NULL,
	"target_id" varchar(256) NOT NULL,
	"reason" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "guild_cases" ADD CONSTRAINT "guild_cases_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;