PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_form_fields` (
	`id` text PRIMARY KEY NOT NULL,
	`form_id` text NOT NULL,
	`type` text NOT NULL,
	`label` text NOT NULL,
	`placeholder` text,
	`required` integer DEFAULT false NOT NULL,
	`options` text,
	`order_index` integer NOT NULL,
	`created_at` integer DEFAULT 1746719532 NOT NULL,
	`updated_at` integer DEFAULT 1746719532 NOT NULL,
	FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_form_fields`("id", "form_id", "type", "label", "placeholder", "required", "options", "order_index", "created_at", "updated_at") SELECT "id", "form_id", "type", "label", "placeholder", "required", "options", "order_index", "created_at", "updated_at" FROM `form_fields`;--> statement-breakpoint
DROP TABLE `form_fields`;--> statement-breakpoint
ALTER TABLE `__new_form_fields` RENAME TO `form_fields`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_forms` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT 1746719532 NOT NULL,
	`updated_at` integer DEFAULT 1746719532 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`settings` text,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_forms`("id", "tenant_id", "title", "description", "created_by", "created_at", "updated_at", "active", "settings") SELECT "id", "tenant_id", "title", "description", "created_by", "created_at", "updated_at", "active", "settings" FROM `forms`;--> statement-breakpoint
DROP TABLE `forms`;--> statement-breakpoint
ALTER TABLE `__new_forms` RENAME TO `forms`;--> statement-breakpoint
CREATE TABLE `__new_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`form_id` text NOT NULL,
	`data` text NOT NULL,
	`ip_hash` text,
	`user_agent_hash` text,
	`created_at` integer DEFAULT 1746719532 NOT NULL,
	FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_submissions`("id", "form_id", "data", "ip_hash", "user_agent_hash", "created_at") SELECT "id", "form_id", "data", "ip_hash", "user_agent_hash", "created_at" FROM `submissions`;--> statement-breakpoint
DROP TABLE `submissions`;--> statement-breakpoint
ALTER TABLE `__new_submissions` RENAME TO `submissions`;--> statement-breakpoint
CREATE TABLE `__new_tenants` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text GENERATED ALWAYS AS (lower(replace("name", ' ', '-'))) VIRTUAL NOT NULL,
	`created_at` integer DEFAULT 1746719532 NOT NULL,
	`updated_at` integer DEFAULT 1746719532 NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_tenants`("id", "name", "created_at", "updated_at", "active") SELECT "id", "name", "created_at", "updated_at", "active" FROM `tenants`;--> statement-breakpoint
DROP TABLE `tenants`;--> statement-breakpoint
ALTER TABLE `__new_tenants` RENAME TO `tenants`;--> statement-breakpoint
CREATE UNIQUE INDEX `tenants_slug_unique` ON `tenants` (`slug`);