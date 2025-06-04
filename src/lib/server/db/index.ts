import type { DrizzleD1Database } from 'drizzle-orm/d1';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
// import type * as schema from './schema';

import type { D1Database } from '@cloudflare/workers-types';
import type { Client } from '@libsql/client';
import { type SQL, and, asc, desc, eq } from 'drizzle-orm';
import * as schema from './schema';

/**
 * Type for the Drizzle client
 */
export type DrizzleClient = Awaited<ReturnType<typeof createDbClient>>;

export async function createDbClient<T extends typeof import('./schema')>({
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
    return drizzle(client, { schema, logger: true });
  }

  if (d1Database) {
    const { drizzle } = await import('drizzle-orm/d1');

    return drizzle(d1Database, { schema, logger: true });
  }

  throw new Error('Unable to create Db');
}

/**
 * Get forms for a tenant
 */
export async function getFormsByTenant(
  db: DrizzleClient,
  organizationId: string
) {
  return db
    .select()
    .from(schema.forms)
    .where(eq(schema.forms.organizationId, organizationId))
    .orderBy(desc(schema.forms.createdAt));
}

/**
 * Create a new form
 */
export async function createForm(
  db: DrizzleClient,
  data: {
    tenantId: string;
    title: string;
    description?: string;
    createdBy: string; // Auth0 user ID
  }
) {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  await db.insert(schema.forms).values({
    id,
    tenantId: data.tenantId,
    title: data.title,
    description: data.description,
    createdBy: data.createdBy,
    createdAt: now,
    updatedAt: now,
    active: true,
  });

  return id;
}

/**
 * Get form by ID with tenant verification
 */
export async function getFormBySlug(
  db: DrizzleClient,
  slug: string,
  tenantId?: string // Optional for public access
) {
  // Build the query
  const filters: SQL[] = [];
  filters.push(eq(schema.forms.slug, slug));

  // Add tenant filter if provided (for admin access)
  if (tenantId) {
    filters.push(eq(schema.forms.tenantId, tenantId));
  }

  const query = db
    .select()
    .from(schema.forms)
    .where(and(...filters));

  return query.get();
}

/**
 * Add a field to a form
 */
export async function addFormField(
  db: DrizzleClient,
  data: {
    formId: string;
    type: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    options?: string[];
    orderIndex: number;
  }
) {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  // Convert options array to JSON string if provided
  const optionsJson = data.options ? JSON.stringify(data.options) : undefined;

  await db.insert(schema.formFields).values({
    id,
    formId: data.formId,
    type: data.type,
    label: data.label,
    placeholder: data.placeholder,
    required: data.required ?? false,
    options: optionsJson,
    orderIndex: data.orderIndex,
    createdAt: now,
    updatedAt: now,
  });

  return id;
}

/**
 * Get all fields for a form
 */
export async function getFormFields(db: DrizzleClient, formId: string) {
  return db
    .select()
    .from(schema.formFields)
    .where(eq(schema.formFields.formId, formId))
    .orderBy(asc(schema.formFields.orderIndex));
}

/**
 * Store a form submission
 */
export async function createSubmission(
  db: DrizzleClient,
  data: {
    formId: string;
    formData: Record<string, unknown>;
    ipHash?: string;
    userAgentHash?: string;
  }
) {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  // Convert form data to JSON string
  const formDataJson = JSON.stringify(data.formData);

  await db.insert(schema.submissions).values({
    id,
    formId: data.formId,
    data: formDataJson,
    ipHash: data.ipHash,
    userAgentHash: data.userAgentHash,
    createdAt: now,
  });

  return id;
}

/**
 * Get submissions for a form
 */
export async function getFormSubmissions(
  db: DrizzleClient,
  formId: string,
  options: {
    page?: number;
    pageSize?: number;
  } = {}
) {
  const page = options.page || 1;
  const pageSize = options.pageSize || 20;

  return db
    .select()
    .from(schema.submissions)
    .where(eq(schema.submissions.formId, formId))
    .orderBy(desc(schema.submissions.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
}

/**
 * Count total submissions for a form
 */
export async function countFormSubmissions(db: DrizzleClient, formId: string) {
  return db.$count(schema.submissions, eq(schema.submissions.formId, formId));
  // const result = await db
  //   .select({
  //     count: db.fn.count().as('count'),
  //   })
  //   .from(schema.submissions)
  //   .where(({ eq }) => eq(schema.submissions.formId, formId))
  //   .get();
  //
  // return result?.count || 0;
}

/**
 * Delete a form and all associated data
 */
export async function deleteForm(
  db: DrizzleClient,
  formId: string,
  tenantId: string
) {
  // First verify the form belongs to this tenant
  const form = await db
    .select()
    .from(schema.forms)
    .where(
      and(eq(schema.forms.id, formId), eq(schema.forms.tenantId, tenantId))
    )
    .get();

  if (!form) {
    throw new Error('Form not found or access denied');
  }

  // Using a transaction to ensure all related data is deleted
  return db.transaction(async tx => {
    // Delete form fields
    await tx
      .delete(schema.formFields)
      .where(eq(schema.formFields.formId, formId));

    // Delete form submissions
    await tx
      .delete(schema.submissions)
      .where(eq(schema.submissions.formId, formId));

    // Delete the form
    await tx.delete(schema.forms).where(eq(schema.forms.id, formId));
  });
}
