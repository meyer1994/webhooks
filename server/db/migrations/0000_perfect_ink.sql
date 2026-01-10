CREATE TABLE `requests` (
	`id` text PRIMARY KEY NOT NULL,
	`webhook_id` text NOT NULL,
	`method` text NOT NULL,
	`url` text NOT NULL,
	`headers` text NOT NULL,
	`query_params` text,
	`body` text,
	`ip_address` text,
	`cf_properties` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`webhook_id`) REFERENCES `webhooks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_request_webhook_id` ON `requests` (`webhook_id`);--> statement-breakpoint
CREATE INDEX `idx_request_created_at` ON `requests` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_request_updated_at` ON `requests` (`updated_at`);--> statement-breakpoint
CREATE INDEX `idx_request_method` ON `requests` (`method`);--> statement-breakpoint
CREATE INDEX `idx_request_url` ON `requests` (`url`);--> statement-breakpoint
CREATE INDEX `idx_request_ip_address` ON `requests` (`ip_address`);--> statement-breakpoint
CREATE TABLE `webhooks` (
	`id` text PRIMARY KEY NOT NULL,
	`response_status` integer DEFAULT 200,
	`response_content_type` text DEFAULT 'application/json',
	`response_body` text DEFAULT '{"status":"ok"}',
	`response_delay` integer DEFAULT 0,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_webhook_created_at` ON `webhooks` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_webhook_updated_at` ON `webhooks` (`updated_at`);