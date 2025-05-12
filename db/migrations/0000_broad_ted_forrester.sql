CREATE TABLE `form_fields` (
	`id` text PRIMARY KEY NOT NULL,
	`form_id` text NOT NULL,
	`type` text NOT NULL,
	`label` text NOT NULL,
	`placeholder` text,
	`required` integer DEFAULT false NOT NULL,
	`options` text,
	`order_index` integer NOT NULL,
	`created_at` integer DEFAULT '"2025-05-12T21:14:20.629Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2025-05-12T21:14:20.629Z"' NOT NULL,
	FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `forms` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`created_by` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`settings` text,
	`created_at` integer DEFAULT '"2025-05-12T21:14:20.629Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2025-05-12T21:14:20.629Z"' NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`form_id` text NOT NULL,
	`data` text NOT NULL,
	`ip_hash` text,
	`user_agent_hash` text,
	`created_at` integer DEFAULT '"2025-05-12T21:14:20.629Z"' NOT NULL,
	FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text GENERATED ALWAYS AS (lower(replace("name", ' ', '-'))) VIRTUAL NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT '"2025-05-12T21:14:20.629Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2025-05-12T21:14:20.629Z"' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tenants_slug_unique` ON `tenants` (`slug`);