import { defineConfig } from 'drizzle-kit';

if (!process.env.TENANT_DB_URL) throw new Error('TENANT_DB_URL is not set');

export default defineConfig({
  schema: './src/lib/server/db/tenant-schema.ts',
  out: './migrations/tenant',
  dbCredentials: { url: process.env.TENANT_DB_URL },
  verbose: true,
  strict: true,
  dialect: 'sqlite',
});
