ALTER TABLE "users" ADD COLUMN "access_token" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "refresh_token" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "token_expires_at" timestamp NOT NULL;