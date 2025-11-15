PRAGMA journal_mode = WAL;

CREATE TABLE `data` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`database_type` text NOT NULL,
	`database_url` text NOT NULL,
	`url` text NOT NULL,
	`registration_enabled` integer NOT NULL DEFAULT 0,
	`bot_token` text NOT NULL,
	`client_id` text NOT NULL,
	`client_secret` text NOT NULL,
	CONSTRAINT data_database_url_unique UNIQUE(`database_url`)
);
