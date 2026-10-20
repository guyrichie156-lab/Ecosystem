CREATE TABLE `workout_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`template_id` integer,
	`name` text NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	FOREIGN KEY (`template_id`) REFERENCES `workout_templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `workout_sessions_finished_at` ON `workout_sessions` (`finished_at`);--> statement-breakpoint
CREATE TABLE `workout_sets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`exercise_id` text NOT NULL,
	`position` integer NOT NULL,
	`weight_grams` integer,
	`reps` integer,
	`done` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `workout_sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `workout_sets_session` ON `workout_sets` (`session_id`,`position`);--> statement-breakpoint
CREATE INDEX `workout_sets_exercise` ON `workout_sets` (`exercise_id`);--> statement-breakpoint
CREATE TABLE `workout_template_exercises` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`template_id` integer NOT NULL,
	`exercise_id` text NOT NULL,
	`position` integer NOT NULL,
	`sets` integer NOT NULL,
	`reps` integer NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `workout_templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `workout_template_exercises_template` ON `workout_template_exercises` (`template_id`,`position`);--> statement-breakpoint
CREATE TABLE `workout_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
