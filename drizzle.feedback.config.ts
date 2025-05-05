import { defineConfig } from 'drizzle-kit';

if (!process.env.FEEDBACK_DB_URL) throw new Error('FEEDBACK_DB_URL is not set');

export default defineConfig({
  schema: './src/lib/server/db/feedback-schema.ts',
  out: './migrations/feedback',
  dbCredentials: { url: process.env.FEEDBACK_DB_URL },
  verbose: true,
  strict: true,
  dialect: 'sqlite',
});
