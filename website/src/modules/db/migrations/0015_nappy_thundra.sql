CREATE TABLE "guild_bans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"case_id" uuid NOT NULL,
	"target_id" varchar(256) NOT NULL,
	"banner_id" varchar(256) NOT NULL,
	"reason" text,
	"expires_at" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "guild_bans" ADD CONSTRAINT "guild_bans_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_bans" ADD CONSTRAINT "guild_bans_case_id_guild_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."guild_cases"("id") ON DELETE cascade ON UPDATE no action;