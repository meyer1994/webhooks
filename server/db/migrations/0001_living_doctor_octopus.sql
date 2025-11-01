PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_executions` (
	`id` text PRIMARY KEY NOT NULL,
	`node_id` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`started_at` integer,
	`finished_at` integer,
	`status` text NOT NULL,
	`input` text NOT NULL,
	`output` text,
	FOREIGN KEY (`node_id`) REFERENCES `nodes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_executions`("id", "node_id", "created_at", "updated_at", "started_at", "finished_at", "status", "input", "output") SELECT "id", "node_id", "created_at", "updated_at", "started_at", "finished_at", "status", "input", "output" FROM `executions`;--> statement-breakpoint
DROP TABLE `executions`;--> statement-breakpoint
ALTER TABLE `__new_executions` RENAME TO `executions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_nodes` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`data` text NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `nodes`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_nodes`("id", "parent_id", "created_at", "updated_at", "data") SELECT "id", "parent_id", "created_at", "updated_at", "data" FROM `nodes`;--> statement-breakpoint
DROP TABLE `nodes`;--> statement-breakpoint
ALTER TABLE `__new_nodes` RENAME TO `nodes`;