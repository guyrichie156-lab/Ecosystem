CREATE TABLE `accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`currency` text DEFAULT 'RUB' NOT NULL,
	`initial_balance` integer DEFAULT 0 NOT NULL,
	`archived_at` integer
);
--> statement-breakpoint
CREATE TABLE `budgets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`period` text DEFAULT 'monthly' NOT NULL,
	`amount_limit` integer NOT NULL,
	`start_month` text NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`color` text,
	`icon` text
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`category_id` integer,
	`counterpart_account_id` integer,
	`occurred_at` integer NOT NULL,
	`note` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`counterpart_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
