CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"totp_verified" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(256) NOT NULL,
	"display_name" varchar(128) NOT NULL,
	"discord_id" varchar(256) NOT NULL,
	"totp_secret" varchar(64),
	"flags" bigint DEFAULT 1::bigint NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_discord_id_unique" UNIQUE("discord_id")
);
--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;