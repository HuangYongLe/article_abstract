CREATE TABLE `summaries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`one_line` text NOT NULL,
	`short` text NOT NULL,
	`detailed` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
