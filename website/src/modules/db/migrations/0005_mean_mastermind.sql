CREATE TABLE "guild_counter_trigger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"counter_id" uuid NOT NULL,
	"trigger_name" text NOT NULL,
	"trigger_condition" varchar(8) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guild_counter_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"counter_id" uuid NOT NULL,
	"user_id" varchar(256),
	"channel_id" varchar(256),
	"value" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "guild_counters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"counter_name" text NOT NULL,
	"per_user" boolean DEFAULT false NOT NULL,
	"per_channel" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone,
	CONSTRAINT "guild_counters_counter_name_unique" UNIQUE("counter_name")
);
--> statement-breakpoint
ALTER TABLE "guild_counter_trigger" ADD CONSTRAINT "guild_counter_trigger_counter_id_guild_counters_id_fk" FOREIGN KEY ("counter_id") REFERENCES "public"."guild_counters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_counter_values" ADD CONSTRAINT "guild_counter_values_counter_id_guild_counters_id_fk" FOREIGN KEY ("counter_id") REFERENCES "public"."guild_counters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_counters" ADD CONSTRAINT "guild_counters_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;