CREATE TABLE `body_measurements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`value` integer NOT NULL,
	`measured_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `body_measurements_kind_measured_at` ON `body_measurements` (`kind`,`measured_at`);