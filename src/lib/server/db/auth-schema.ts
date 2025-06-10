// import type { Invitation } from 'better-auth/plugins/organization';
// import { relations } from 'drizzle-orm';
// import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
// import { forms } from './schema';
//
// export type UserRoles = 'admin' | 'user';
//
// export const users = sqliteTable('users', {
//   id: text('id').primaryKey(),
//   name: text('name').notNull(),
//   email: text('email').notNull().unique(),
//   emailVerified: integer('email_verified', { mode: 'boolean' })
//     .$defaultFn(() => false)
//     .notNull(),
//   image: text('image'),
//   createdAt: integer('created_at', { mode: 'timestamp' })
//     .$defaultFn(() => /* @__PURE__ */ new Date())
//     .notNull(),
//   updatedAt: integer('updated_at', { mode: 'timestamp' })
//     .$defaultFn(() => /* @__PURE__ */ new Date())
//     .notNull(),
//   role: text('role')
//     .$type<UserRoles>()
//     .$default(() => 'user')
//     .notNull(),
//   banned: integer('banned', { mode: 'boolean' }),
//   banReason: text('ban_reason'),
//   banExpires: integer('ban_expires', { mode: 'timestamp' }),
// });
//
// export const sessions = sqliteTable('sessions', {
//   id: text('id').primaryKey(),
//   expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
//   token: text('token').notNull().unique(),
//   createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
//   updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
//   ipAddress: text('ip_address'),
//   userAgent: text('user_agent'),
//   userId: text('user_id')
//     .notNull()
//     .references(() => users.id, { onDelete: 'cascade' }),
//   impersonatedBy: text('impersonated_by'),
//   activeOrganizationId: text('active_organization_id').references(
//     () => organizations.id,
//     { onDelete: 'cascade' }
//   ),
// });
//
// export const accounts = sqliteTable('accounts', {
//   id: text('id').primaryKey(),
//   accountId: text('account_id').notNull(),
//   providerId: text('provider_id').notNull(),
//   userId: text('user_id')
//     .notNull()
//     .references(() => users.id, { onDelete: 'cascade' }),
//   accessToken: text('access_token'),
//   refreshToken: text('refresh_token'),
//   idToken: text('id_token'),
//   accessTokenExpiresAt: integer('access_token_expires_at', {
//     mode: 'timestamp',
//   }),
//   refreshTokenExpiresAt: integer('refresh_token_expires_at', {
//     mode: 'timestamp',
//   }),
//   scope: text('scope'),
//   password: text('password'),
//   createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
//   updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
// });
//
// export const verifications = sqliteTable('verifications', {
//   id: text('id').primaryKey(),
//   identifier: text('identifier').notNull(),
//   value: text('value').notNull(),
//   expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
//   createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(
//     () => /* @__PURE__ */ new Date()
//   ),
//   updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(
//     () => /* @__PURE__ */ new Date()
//   ),
// });
//
// export const organizations = sqliteTable('organizations', {
//   id: text('id').primaryKey(),
//   name: text('name').notNull(),
//   slug: text('slug').unique(),
//   logo: text('logo'),
//   createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
//   metadata: text('metadata'),
// });
//
// export const organizationRelations = relations(forms, ({ many, one }) => ({
//   forms: many(forms),
//   members: many(members),
//   invitations: many(invitations),
// }));
//
// type MemberRoles = 'owner' | 'admin' | 'member';
//
// export const members = sqliteTable('members', {
//   id: text('id').primaryKey(),
//   organizationId: text('organization_id')
//     .notNull()
//     .references(() => organizations.id, { onDelete: 'cascade' }),
//   userId: text('user_id')
//     .notNull()
//     .references(() => users.id, { onDelete: 'cascade' }),
//   role: text('role')
//     .$type<MemberRoles>()
//     .$default(() => 'member')
//     .notNull(),
//   createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
// });
//
// export const invitations = sqliteTable('invitations', {
//   id: text('id').primaryKey(),
//   organizationId: text('organization_id')
//     .notNull()
//     .references(() => organizations.id, { onDelete: 'cascade' }),
//   email: text('email').notNull(),
//   role: text('role')
//     .$type<MemberRoles>()
//     .$default(() => 'member')
//     .notNull(),
//   status: text('status')
//     .default('pending')
//     .$type<Invitation['status']>()
//     .notNull(),
//   expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
//   inviterId: text('inviter_id')
//     .notNull()
//     .references(() => users.id, { onDelete: 'cascade' }),
// });
