import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Define your feedback table
export const feedback = sqliteTable('feedback', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  content: text('content').notNull(),
  rating: integer('rating').notNull(),
  category: text('category'),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
  ip_hash: text('ip_hash'),
  user_agent_hash: text('user_agent_hash'),
});

export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;
