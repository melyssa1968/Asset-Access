CREATE TABLE `visitor_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`link_id` text NOT NULL,
	`visitor_email` text,
	`country` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	FOREIGN KEY (`link_id`) REFERENCES `share_links`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `assets` ADD `archived_at` integer;--> statement-breakpoint
ALTER TABLE `share_links` ADD `label` text;--> statement-breakpoint
ALTER TABLE `share_links` ADD `expires_at` integer;--> statement-breakpoint
ALTER TABLE `share_links` ADD `revoked_at` integer;--> statement-breakpoint
ALTER TABLE `visits` ADD `session_id` text REFERENCES visitor_sessions(id);--> statement-breakpoint
ALTER TABLE `visits` ADD `duration_ms` integer;--> statement-breakpoint
ALTER TABLE `visits` ADD `progress` integer;