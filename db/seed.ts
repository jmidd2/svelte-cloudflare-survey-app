import * as schema from '../src/lib/server/db/schema';
import {createClient} from '@libsql/client';
import {drizzle} from 'drizzle-orm/libsql';
import {ALL_FIELD_TYPES} from '../src/lib/utils/form-fields/constants';
import {sampleFormFieldLabels} from '../src/lib/sample';
import {v4 as uuidv4} from 'uuid';
import type {InsertForm, InsertOrganization, InsertSubmission} from "../src/lib/server/db/schema";
import type {FormFieldType} from "../src/lib/types.d";
import chalk from 'chalk';

const BASE_DATE = new Date(Date.now() - 10000000000);

async function createForm(db: ReturnType<typeof drizzle>, formId: string, index: number, organizationId = 'phoenix-spark', createdBy = 'first-user', active = true) {
  const title = `Form ${index + 1}`;
  const formData: InsertForm = {
    id: formId,
    organizationId,
    title,
    description: `Sample form description for testing purposes.`,
    createdAt: BASE_DATE,
    updatedAt: BASE_DATE,
    active,
    createdBy,
    slug: `${title.replaceAll(' ', '-').toLowerCase()}-${uuidv4().substring(0, 8)}`,
  }

  await db.insert(schema.forms).values(formData);
}

async function createFormFields(db: ReturnType<typeof drizzle>, formId: string, orderIndex: number) {
  const fieldType = ALL_FIELD_TYPES[Math.floor(Math.random() * ALL_FIELD_TYPES.length)];
  const label = sampleFormFieldLabels[Math.floor(Math.random() * sampleFormFieldLabels.length)];

  await db.insert(schema.formFields).values({
    id: uuidv4(),
    formId,
    type: fieldType,
    label,
    placeholder: label,
    required: Math.random() > 0.5,
    options: ['radio', 'select', 'checkbox'].includes(fieldType)
      ? [
        {label: 'value 1', val: 'val-1'},
        {label: 'value 2', val: 'val-2'},
        {label: 'value 3', val: 'val-3'},
      ]
      : null,
    orderIndex,
    createdAt: BASE_DATE,
    updatedAt: BASE_DATE,
  });
}

async function createFormSubmissions(db: ReturnType<typeof drizzle>, formId: string, index: number) {
  const fieldType = ALL_FIELD_TYPES[Math.floor(Math.random() * ALL_FIELD_TYPES.length)];
  const submissionData: InsertSubmission = {
    id: uuidv4(),
    formId,
    data: 'checkbox'.includes(fieldType) ? [{
      field: {
        id: `field${index + 1}`,
        type: fieldType as Extract<'checkbox', FormFieldType>,
        primitive: 'string',
      },
      submitted: {
        values: ['val-1', 'val-2', 'val-3'],
      }
    }] : [{
      field: {
        id: `field${index + 1}`,
        type: fieldType as Exclude<'checkbox', FormFieldType>,
        primitive: 'string',
      },
      submitted: {
        value: 'val-1',
      }
    }],
    createdAt: BASE_DATE,
  }
  await db.insert(schema.submissions).values(submissionData);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const client = createClient({url: process.env.DATABASE_URL});
  const db = drizzle(client, {schema});

  console.log(chalk.blue('🌱 Starting database seed...'));

  // Check if data already exists and clean if necessary
  const existingCount = await db.$count(schema.organizations);
  if (existingCount > 0) {
    console.log(chalk.yellow('🧹 Cleaning existing data...'));
    // Clean up in reverse dependency order
    await db.delete(schema.submissions);
    await db.delete(schema.formFields);
    await db.delete(schema.forms);
    await db.delete(schema.members);
    await db.delete(schema.accounts);
    await db.delete(schema.users);
    await db.delete(schema.organizations);
  }

  const baseDate = new Date(Date.now() - 10000000000);

  // Insert initial user
  console.log('👤 Creating initial user...');
  await db.insert(schema.users).values({
    id: 'first-user',
    name: 'Jon Middleton',
    email: 'jonathan.middleton@travisspark.com',
    emailVerified: true,
    role: 'admin',
    banned: false,
    createdAt: baseDate,
    updatedAt: baseDate,
  });

  // Insert initial account
  console.log('🔐 Creating initial account...');
  await db.insert(schema.accounts).values({
    id: 'first-account',
    accountId: 'first-account',
    providerId: 'email-otp',
    userId: 'first-user',
    createdAt: baseDate,
    updatedAt: baseDate,
  });

  // Insert initial organization
  console.log('🏠 Creating Phoenix Spark organization...');
  await db.insert(schema.organizations).values({
    id: 'phoenix-spark',
    name: 'Phoenix Spark',
    slug: 'phoenix-spark',
    createdAt: baseDate,
  });

  // Insert initial member
  console.log('👥 Creating initial member...');
  await db.insert(schema.members).values({
    id: 'first-member',
    organizationId: 'phoenix-spark',
    userId: 'first-user',
    role: 'owner',
    createdAt: baseDate,
  });

  // Create forms for Phoenix Spark
  console.log('📋 Creating forms for Phoenix Spark...');
  const phoenixSparkForms = [];
  for (let i = 0; i < 2; i++) {
    const formId = uuidv4();
    await createForm(db, formId, i);
    phoenixSparkForms.push(formId);
  }

  // Create form fields for Phoenix Spark forms
  console.log('📝 Creating form fields...');
  for (const formId of phoenixSparkForms) {
    for (let i = 0; i < 4; i++) {
      await createFormFields(db, formId, i);
    }
  }

  // Create submissions for Phoenix Spark forms
  console.log('📊 Creating form submissions...');
  for (const formId of phoenixSparkForms) {
    for (let i = 0; i < 3; i++) {
      await createFormSubmissions(db, formId, i);
    }
  }

  // Create additional test tenants
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

  console.log('🏢 Creating additional test organizations...');
  for (let tenantIndex = 0; tenantIndex < 3; tenantIndex++) {
    const tenantId = uuidv4();
    const tenantName = tenantNames[tenantIndex % tenantNames.length];

    // Create org
    const orgData: InsertOrganization = {
      id: tenantId,
      name: tenantName,
      createdAt: baseDate,
    }

    await db.insert(schema.organizations).values(orgData);

    // Create forms for this tenant
    const tenantForms = [];
    for (let i = 0; i < 2; i++) {
      const formId = uuidv4();
      await createForm(db, formId, i, tenantId);
      tenantForms.push(formId);
    }

    // Create form fields for each form
    for (const formId of tenantForms) {
      for (let i = 0; i < 4; i++) {
        await createFormFields(db, formId, i);
      }
    }

    // Create submissions for each form
    for (const formId of tenantForms) {
      for (let i = 0; i < 3; i++) {
        await createFormSubmissions(db, formId, i);
      }
    }
  }

  console.log(chalk.green('✅ Database seed completed successfully!'));
}

main().catch(console.error);