CREATE TABLE `food_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`food_id` integer NOT NULL,
	`grams` integer NOT NULL,
	`meal` text NOT NULL,
	`eaten_at` integer NOT NULL,
	`kcal` integer NOT NULL,
	`protein` integer NOT NULL,
	`fat` integer NOT NULL,
	`carbs` integer NOT NULL,
	FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `food_entries_eaten_at` ON `food_entries` (`eaten_at`);--> statement-breakpoint
CREATE TABLE `foods` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`brand` text,
	`barcode` text,
	`source` text NOT NULL,
	`base_key` text,
	`kcal` integer NOT NULL,
	`protein` integer NOT NULL,
	`fat` integer NOT NULL,
	`carbs` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `foods_barcode` ON `foods` (`barcode`);--> statement-breakpoint
CREATE UNIQUE INDEX `foods_base_key` ON `foods` (`base_key`);