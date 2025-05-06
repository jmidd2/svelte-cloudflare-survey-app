import * as schema from '$lib/server/db/schema';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { seed } from 'drizzle-seed';

async function main() {
  const client = createClient({ url: process.env.DATABASE_URL });
  const db = drizzle(client, { schema });

  await seed(db, schema);
}

main();
