import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Tenants table - stores information about each tenant
export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  planType: text('plan_type').notNull().default('free'),
  createdAt: integer('created_at')
    .notNull()
    .default(Math.floor(Date.now() / 1000)),
  updatedAt: integer('updated_at')
    .notNull()
    .default(Math.floor(Date.now() / 1000)),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
});

export const forms = sqliteTable('forms', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  createdBy: text('created_by').notNull(),
  createdAt: integer('created_at')
    .notNull()
    .default(Math.floor(Date.now() / 1000)),
  updatedAt: integer('updated_at')
    .notNull()
    .default(Math.floor(Date.now() / 1000)),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  settings: text('settings'), // JSON string for additional settings
});

export const formFields = sqliteTable('form_fields', {
  id: text('id').primaryKey(),
  formId: text('form_id')
    .notNull()
    .references(() => forms.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'text', 'textarea', 'select', 'radio', 'checkbox', etc.
  label: text('label').notNull(),
  placeholder: text('placeholder'),
  required: integer('required', { mode: 'boolean' }).notNull().default(false),
  options: text('options'), // JSON string for options (select, radio, etc.)
  orderIndex: integer('order_index').notNull(),
  createdAt: integer('created_at')
    .notNull()
    .default(Math.floor(Date.now() / 1000)),
  updatedAt: integer('updated_at')
    .notNull()
    .default(Math.floor(Date.now() / 1000)),
});

export const submissions = sqliteTable('submissions', {
  id: text('id').primaryKey(),
  formId: text('form_id')
    .notNull()
    .references(() => forms.id, { onDelete: 'cascade' }),
  data: text('data').notNull(), // JSON string with form data
  ipHash: text('ip_hash'), // Anonymized IP hash
  userAgentHash: text('user_agent_hash'), // Anonymized user agent hash
  createdAt: integer('created_at')
    .notNull()
    .default(Math.floor(Date.now() / 1000)),
});

export const formViews = sqliteTable('form_views', {
  id: text('id').primaryKey(),
  formId: text('form_id')
    .notNull()
    .references(() => forms.id, { onDelete: 'cascade' }),
  viewedAt: integer('viewed_at')
    .notNull()
    .default(Math.floor(Date.now() / 1000)),
  ipHash: text('ip_hash'), // Anonymized IP hash
  userAgentHash: text('user_agent_hash'), // Anonymized user agent hash
  referrer: text('referrer'),
});
