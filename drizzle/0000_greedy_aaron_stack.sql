CREATE TABLE `summaries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`site_name` text,
	`one_sentence` text NOT NULL,
	`short_summary` text NOT NULL,
	`detailed_summary` text NOT NULL,
	`model` text NOT NULL,
	`token_count` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
