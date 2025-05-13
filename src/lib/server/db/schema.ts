import { formElements } from '$lib';
import type { HtmlFormElements } from '$lib/types';
import { type InferSelectModel, type SQL, sql } from 'drizzle-orm';
// src/lib/db/schema.ts
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(new Date(Date.now())),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(new Date(Date.now())),
};

// Tenants table - stores information about each tenant
export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug')
    .generatedAlwaysAs(
      (): SQL => sql`lower
                (replace(${tenants.name}, ' ', '-'))`,
      {
        mode: 'virtual',
      }
    )
    .notNull()
    .unique(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  ...timestamps,
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
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  settings: text('settings', { mode: 'json' }).$type<{
    email: string;
    name: string;
    isGraduated: boolean;
    hasJob: boolean;
    visitedCountries: string;
  }>(), // JSON string for additional settings
  ...timestamps,
});

// Form fields table - stores fields for each form
export const formFields = sqliteTable('form_fields', {
  id: text('id').primaryKey(),
  formId: text('form_id')
    .notNull()
    .references(() => forms.id, { onDelete: 'cascade' }),
  type: text('type').notNull().$type<HtmlFormElements>(), // 'text', 'textarea', 'select', 'radio', 'checkbox', etc.
  label: text('label').notNull(),
  placeholder: text('placeholder'),
  required: integer('required', { mode: 'boolean' }).notNull().default(false),
  options: text('options', { mode: 'json' }).$type<
    Array<{ val: string; label: string }>
  >(), // JSON string for options (select, radio, etc.)
  orderIndex: integer('order_index').notNull(),
  ...timestamps,
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
  createdAt: timestamps.createdAt,
});

export type SelectFormField = InferSelectModel<typeof formFields>;
export type InsertFormField = typeof formFields.$inferInsert;

export const formFieldInsertSchema = createInsertSchema(formFields, {
  type: z.custom<HtmlFormElements>(val => {
    if (typeof val !== 'string') {
      return false;
    }
    return formElements.includes(val as HtmlFormElements);
  }),
});
