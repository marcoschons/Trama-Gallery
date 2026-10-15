CREATE TABLE `artists` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`handle` text NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`instagram` text DEFAULT '' NOT NULL,
	`portfolio` text DEFAULT '' NOT NULL,
	`contact_email` text DEFAULT '' NOT NULL,
	`whatsapp` text DEFAULT '' NOT NULL,
	`open` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `artists_user_id_unique` ON `artists` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `artists_handle_unique` ON `artists` (`handle`);--> statement-breakpoint
CREATE TABLE `works` (
	`id` text PRIMARY KEY NOT NULL,
	`artist_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`category` text NOT NULL,
	`tags` text DEFAULT '' NOT NULL,
	`image_key` text NOT NULL,
	`mime_type` text NOT NULL,
	`bytes` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `works_artist_idx` ON `works` (`artist_id`);--> statement-breakpoint
CREATE INDEX `works_created_idx` ON `works` (`created_at`);