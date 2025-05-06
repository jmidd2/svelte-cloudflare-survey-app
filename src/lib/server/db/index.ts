import type { DrizzleD1Database } from 'drizzle-orm/d1';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
// import type * as schema from './schema';

import type { D1Database } from '@cloudflare/workers-types';
import type { Client } from '@libsql/client';

export async function createDb<T extends typeof import('./schema')>({
  d1Database,
  dbUrl,
  schema,
}: {
  d1Database?: D1Database;
  dbUrl?: string;
  schema: T;
}): Promise<
  | (LibSQLDatabase<T> & { $client: Client })
  | (DrizzleD1Database<T> & { $client: D1Database })
> {
  if (dbUrl) {
    const { createClient } = await import('@libsql/client');
    const { drizzle } = await import('drizzle-orm/libsql');

    const client = createClient({ url: dbUrl });
    return drizzle(client, { schema });
  }

  if (d1Database) {
    const { drizzle } = await import('drizzle-orm/d1');

    return drizzle(d1Database, { schema });
  }

  throw new Error('Unable to create Db');
}
