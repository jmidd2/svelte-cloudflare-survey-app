import type { HtmlFormElements } from '$lib/types';
import type { Invitation } from 'better-auth/plugins/organization';
import { type InferSelectModel, type SQL, relations, sql } from 'drizzle-orm';
// src/lib/db/schema.ts
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod/v4';
import { formElements } from '../../index';

// export * from './auth-schema';
export type UserRoles = 'admin' | 'user';
export type MemberRoles = 'owner' | 'admin' | 'member';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' })
    .$defaultFn(() => false)
    .notNull(),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  role: text('role')
    .$type<UserRoles>()
    .$default(() => 'user')
    .notNull(),
  banned: integer('banned', { mode: 'boolean' }),
  banReason: text('ban_reason'),
  banExpires: integer('ban_expires', { mode: 'timestamp' }),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  impersonatedBy: text('impersonated_by'),
  activeOrganizationId: text('active_organization_id').references(
    () => organizations.id,
    { onDelete: 'cascade' }
  ),
});

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', {
    mode: 'timestamp',
  }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', {
    mode: 'timestamp',
  }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const verifications = sqliteTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
});

export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').unique(),
  logo: text('logo'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  metadata: text('metadata'),
});

export const members = sqliteTable('members', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: text('role')
    .$type<MemberRoles>()
    .$default(() => 'member')
    .notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const invitations = sqliteTable('invitations', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role')
    .$type<MemberRoles>()
    .$default(() => 'member')
    .notNull(),
  status: text('status')
    .default('pending')
    .$type<Invitation['status']>()
    .notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  inviterId: text('inviter_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
});

const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
};

// Tenants table - stores information about each tenant
export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug')
    .generatedAlwaysAs(
      (): SQL => sql`lower
                (replace(
      ${tenants.name},
      ' ',
      '-'
      )
      )`,
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
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  createdBy: text('created_by').notNull(), // Auth0 user ID
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  slug: text('slug').$default((): SQL => {
    return sql`
        lower(
          trim(
            replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(${forms.title},' ', '-'),'_','-'),'&','and'),'@','at'),'#',''),'%',''),'+',''),'=',''),'!',''),'?',''),'.',''),',',''),'--','-')
            ||'-'||
            substr(lower(hex(randomblob(16))),1,5)
          )
        )
      `;
  }),
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

export type SubmissionData =
  | {
      formFieldId: string;
      fieldType: Extract<'checkbox', HtmlFormElements>;
      primitive: 'string' | 'number' | 'boolean' | 'date';
      values: Array<string | number>;
    }
  | {
      formFieldId: string;
      fieldType: Exclude<HtmlFormElements, 'checkbox'>;
      primitive: 'string' | 'number' | 'boolean' | 'date';
      value: string | number | boolean;
    };

// Form submissions table - stores user submissions
export const submissions = sqliteTable('submissions', {
  id: text('id').primaryKey(),
  formId: text('form_id')
    .notNull()
    .references(() => forms.id, { onDelete: 'cascade' }),
  data: text('data', { mode: 'json' }).$type<SubmissionData[]>().notNull(), // JSON string with form data
  ipHash: text('ip_hash'), // Anonymized IP hash
  userAgentHash: text('user_agent_hash'), // Anonymized user agent hash
  createdAt: timestamps.createdAt,
});

export const accountRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const organizationRelations = relations(forms, ({ many }) => ({
  forms: many(forms),
  members: many(members),
  invitations: many(invitations),
}));

export const memberRelations = relations(members, ({ one }) => ({
  user: one(users, {
    fields: [members.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [members.organizationId],
    references: [organizations.id],
  }),
}));

export const formsRelations = relations(forms, ({ many, one }) => ({
  fields: many(formFields),
  organization: one(organizations, {
    fields: [forms.organizationId],
    references: [organizations.id],
  }),
  submissions: many(submissions),
}));

export const formFieldRelations = relations(formFields, ({ one }) => ({
  form: one(forms, {
    fields: [formFields.formId],
    references: [forms.id],
  }),
}));

export const submissionRelations = relations(submissions, ({ one }) => ({
  form: one(forms, {
    fields: [submissions.formId],
    references: [forms.id],
  }),
}));

export type SelectFormField = InferSelectModel<typeof formFields>;

export type SelectFormFieldWithHash = Omit<SelectFormField, 'id'> & {
  hash: string;
};
export type InsertFormField = typeof formFields.$inferInsert;

export type SelectForm = InferSelectModel<typeof forms>;

export type SelectFormWithFields = SelectForm & { fields: SelectFormField[] };

export const formFieldInsertSchema = createInsertSchema(formFields, {
  type: z.custom<HtmlFormElements>(val => {
    if (typeof val !== 'string') {
      return false;
    }
    return formElements.includes(val as HtmlFormElements);
  }),
});
