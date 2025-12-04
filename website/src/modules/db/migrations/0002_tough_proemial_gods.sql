CREATE TABLE "guilds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(256) NOT NULL,
	"guild_id" varchar(256) NOT NULL,
	"icon_hash" varchar(256),
	"owner_id" varchar(256) NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone,
	CONSTRAINT "guilds_guild_id_unique" UNIQUE("guild_id")
);
--> statement-breakpoint
ALTER TABLE "guilds" ADD CONSTRAINT "guilds_owner_id_users_discord_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("discord_id") ON DELETE cascade ON UPDATE no action;