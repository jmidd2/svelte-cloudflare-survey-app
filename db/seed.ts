import * as schema from '$lib/server/db/schema';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { reset, seed } from 'drizzle-seed';

async function main() {
  const client = createClient({ url: process.env.DATABASE_URL });
  const db = drizzle(client, { schema });

  const test = await db.$count(schema.tenants);

  if (test > 0) await reset(db, schema);

  await seed(db, schema).refine(f => {
    return {
      formFields: {
        columns: {
          type: f.valuesFromArray({
            values: ['text', 'radio', 'checkbox', 'select'],
          }),
          // label: {},
          // placeholder: {},
          required: f.boolean(),
          options: f.json({ arraySize: 3 }),
          orderIndex: f.int({ maxValue: 50, minValue: 0 }),
          createdAt: f.date({ minDate: new Date('2020-01-01') }),
          updatedAt: f.date({ minDate: new Date('2020-01-01') }),
        },
      },
      forms: {
        columns: {
          // title: {},
          description: f.loremIpsum({ sentencesCount: 1 }),
          createdAt: f.date({ minDate: new Date('2020-01-01') }),
          createdBy: f.date({ minDate: new Date('2020-01-01') }),
          updatedAt: f.date({ minDate: new Date('2020-01-01') }),
          // settings: {},
          active: f.default({ defaultValue: true }),
          settings: f.json(),
        },
        with: {
          formFields: 4,
          submissions: 3,
        },
      },
      submissions: {
        columns: {
          data: f.json({ arraySize: 3 }),
          // ipHash: {},
          // userAgentHash: {},
          createdAt: f.date({ minDate: new Date('2020-01-01') }),
        },
      },
      tenants: {
        columns: {
          slug: f.valuesFromArray({
            values: ['phoenix-spark', 'tenant-1', 'tenant-2'],
            isUnique: true,
          }),
          active: f.default({ defaultValue: true }),
          createdAt: f.date({ minDate: new Date('2020-01-01') }),
          updatedAt: f.date({ minDate: new Date('2020-01-01') }),
        },
        with: {
          forms: 2,
        },
        count: 3,
      },
    };
  });
}

main();
