ALTER TABLE `body_measurements` ADD `source` text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `body_measurements` ADD `external_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `body_measurements_external_id` ON `body_measurements` (`external_id`);