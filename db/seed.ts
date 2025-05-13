import * as schema from '$lib/server/db/schema';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { reset, seed } from 'drizzle-seed';
import { formElements, sampleFormFieldLabels } from '../src/lib';

async function main() {
  const client = createClient({ url: process.env.DATABASE_URL });
  const db = drizzle(client, { schema });

  const test = await db.$count(schema.tenants);

  if (test > 0) await reset(db, schema);

  const tenantNames = [
    'Blue Ocean Solutions',
    'Sierra Analytics',
    'Horizon Industries',
    'Pulse Metrics',
    'Nova Systems',
    'Emerald Insights',
    'Apex Consulting',
    'Catalyst Research',
    'Quantum Dynamics',
  ];

  const formFields = f => ({
    columns: {
      id: f.uuid(),
      type: f.valuesFromArray({
        values: formElements,
      }),
      label: f.valuesFromArray({ values: sampleFormFieldLabels }),
      placeholder: f.valuesFromArray({ values: sampleFormFieldLabels }),
      required: f.boolean(),
      options: f.default({
        defaultValue: [
          { label: 'value 1', val: 'val-1' },
          { label: 'value 2', val: 'val-2' },
          { label: 'value 3', val: 'val-3' },
        ],
      }),
      orderIndex: f.int({ maxValue: 50, minValue: 0 }),
      createdAt: f.default({
        defaultValue: new Date(Date.now() - 10000000000),
      }),
      updatedAt: f.default({
        defaultValue: new Date(Date.now() - 10000000000),
      }),
    },
  });

  const forms = f => ({
    columns: {
      id: f.uuid(),
      title: f.valuesFromArray({ values: ['Course Feedback', 'Survey'] }),
      description: f.loremIpsum({ sentencesCount: 1 }),
      createdAt: f.default({
        defaultValue: new Date(Date.now() - 10000000000),
      }),
      createdBy: f.default({
        defaultValue: new Date(Date.now() - 10000000000),
      }),
      updatedAt: f.default({
        defaultValue: new Date(Date.now() - 10000000000),
      }),
      // settings: {},
      active: f.default({ defaultValue: true }),
      settings: f.json(),
    },
    with: {
      formFields: 4,
      submissions: 3,
    },
  });

  const submissions = f => ({
    columns: {
      id: f.uuid(),
      data: f.json({ arraySize: 3 }),
      // ipHash: {},
      // userAgentHash: {},
      createdAt: f.default({
        defaultValue: new Date(Date.now() - 10000000000),
      }),
    },
  });

  await seed(db, schema).refine(f => {
    return {
      formFields: formFields(f),
      forms: forms(f),
      submissions: submissions(f),
      tenants: {
        columns: {
          id: f.uuid(),
          name: f.default({ defaultValue: 'Phoenix Spark' }),
          active: f.default({ defaultValue: true }),
          createdAt: f.default({
            defaultValue: new Date(Date.now() - 10000000000),
          }),
          updatedAt: f.default({
            defaultValue: new Date(Date.now() - 10000000000),
          }),
        },
        with: {
          forms: 2,
        },
        count: 1,
      },
    };
  });

  await seed(db, schema, { seed: 12345 }).refine(f => {
    return {
      formFields: formFields(f),
      forms: forms(f),
      submissions: submissions(f),
      tenants: {
        columns: {
          id: f.uuid(),
          name: f.valuesFromArray({ values: tenantNames, isUnique: true }),
          active: f.default({ defaultValue: true }),
          createdAt: f.default({
            defaultValue: new Date(Date.now() - 10000000000),
          }),
          updatedAt: f.default({
            defaultValue: new Date(Date.now() - 10000000000),
          }),
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
