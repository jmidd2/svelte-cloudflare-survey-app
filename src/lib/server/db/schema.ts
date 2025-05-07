// src/lib/db/schema.ts
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';

// Tenants table - stores information about each tenant
export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: integer('created_at')
    .notNull()
    .default(Math.floor(Date.now() / 1000)),
  updatedAt: integer('updated_at')
    .notNull()
    .default(Math.floor(Date.now() / 1000)),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
});

// Forms table - stores form definitions
export const forms = sqliteTable('forms', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  createdBy: text('created_by').notNull(), // Auth0 user ID
  createdAt: integer('created_at')
    .notNull()
    .default(Math.floor(Date.now() / 1000)),
  updatedAt: integer('updated_at')
    .notNull()
    .default(Math.floor(Date.now() / 1000)),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  settings: text('settings', { mode: 'json' }), // JSON string for additional settings
});

// Form fields table - stores fields for each form
export const formFields = sqliteTable('form_fields', {
  id: text('id').primaryKey(),
  formId: text('form_id')
    .notNull()
    .references(() => forms.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'text', 'textarea', 'select', 'radio', 'checkbox', etc.
  label: text('label').notNull(),
  placeholder: text('placeholder'),
  required: integer('required', { mode: 'boolean' }).notNull().default(false),
  options: text('options', { mode: 'json' }), // JSON string for options (select, radio, etc.)
  orderIndex: integer('order_index').notNull(),
  createdAt: integer('created_at')
    .notNull()
    .default(Math.floor(Date.now() / 1000)),
  updatedAt: integer('updated_at')
    .notNull()
    .default(Math.floor(Date.now() / 1000)),
});

// Form submissions table - stores user submissions
export const submissions = sqliteTable('submissions', {
  id: text('id').primaryKey(),
  formId: text('form_id')
    .notNull()
    .references(() => forms.id, { onDelete: 'cascade' }),
  data: text('data', { mode: 'json' }).notNull(), // JSON string with form data
  ipHash: text('ip_hash'), // Anonymized IP hash
  userAgentHash: text('user_agent_hash'), // Anonymized user agent hash
  createdAt: integer('created_at')
    .notNull()
    .default(Math.floor(Date.now() / 1000)),
});
