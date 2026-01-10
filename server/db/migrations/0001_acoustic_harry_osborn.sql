CREATE TABLE `requests` (
	`id` text PRIMARY KEY NOT NULL,
	`webhook_id` text NOT NULL,
	`method` text NOT NULL,
	`url` text NOT NULL,
	`headers` text NOT NULL,
	`query_params` text,
	`body` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`webhook_id`) REFERENCES `webhooks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_webhook_id` ON `requests` (`webhook_id`);--> statement-breakpoint
CREATE TABLE `webhooks` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`response_status` integer DEFAULT 200,
	`response_content_type` text DEFAULT 'application/json',
	`response_body` text DEFAULT '{"status":"ok"}',
	`response_delay` integer DEFAULT 0
);
