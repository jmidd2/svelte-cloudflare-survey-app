import type { D1Database } from '@cloudflare/workers-types';
import type { Client } from '@libsql/client';
import { instrumentD1WithSentry } from '@sentry/cloudflare';
import { and, asc, count, desc, eq, not, type SQL, sql } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from './schema';

/**
 * Type for the Drizzle client
 */
export type DrizzleClient = Awaited<ReturnType<typeof createDbClient>>;

const enableLogger = process.env.DEBUG_DB === 'true';

// Cache for database clients using symbols as keys
const dbClientCache = new Map<symbol, DrizzleClient>();

// Function to create a deterministic symbol for a given URL
function getClientSymbol(dbUrl?: string, isD1?: boolean): symbol {
  if (isD1) {
    return Symbol.for('D1_DATABASE_CLIENT');
  }
  if (dbUrl) {
    return Symbol.for(`LIBSQL_CLIENT_${dbUrl}`);
  }
  throw new Error('Invalid client parameters');
}

export type DbSchema = typeof import('./schema');

export async function createDbClient({
  d1Database,
  dbUrl,
  schema,
}: {
  d1Database?: D1Database;
  dbUrl?: string;
  schema: DbSchema;
}): Promise<
  | (LibSQLDatabase<DbSchema> & { $client: Client })
  | (DrizzleD1Database<DbSchema> & { $client: D1Database })
> {
  const cacheKey = getClientSymbol(dbUrl, !!d1Database);

  // Check if we have a cached client
  if (dbClientCache.has(cacheKey)) {
    // biome-ignore lint/style/noNonNullAssertion: <has() checks for undefined>
    return dbClientCache.get(cacheKey)!;
  }

  let client: DrizzleClient;

  if (dbUrl) {
    const { createClient } = await import('@libsql/client');
    const { drizzle } = await import('drizzle-orm/libsql');

    const libsqlClient = createClient({ url: dbUrl });
    client = drizzle(libsqlClient, {
      schema,
      logger: enableLogger,
    }) as unknown as LibSQLDatabase<DbSchema> & { $client: Client };
  } else if (d1Database) {
    const { drizzle } = await import('drizzle-orm/d1');

    client = drizzle(instrumentD1WithSentry(d1Database), {
      schema,
      logger: enableLogger,
    }) as unknown as DrizzleD1Database<DbSchema> & { $client: D1Database };
  } else {
    throw new Error('Unable to create Db');
  }

  // Cache the client
  dbClientCache.set(cacheKey, client);

  return client;
}

/**
 * Get responses for form
 */
export async function getResponsesByFormId(db: DrizzleClient, formId: string) {
  return db
    .select()
    .from(schema.submissions)
    .where(eq(schema.submissions.formId, formId))
    .orderBy(desc(schema.submissions.createdAt))
    .groupBy(schema.submissions.id);
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
 * Used to pull all requests of current user to show on their admin dashboard
 * - only pulls statuses that aren't accepted
 * - only needs to return necessary data
 */
export async function getRequestByUser(db: DrizzleClient, userId: string){
  return db
    .select({
      id: schema.requests.id,
      userId: schema.requests.userId,
      organizationId: schema.requests.organizationId,
      organizationName: schema.organizations.name,
      status: schema.requests.status,
      expiresAt: schema.requests.expiresAt,
      role: schema.requests.role,
    })
    .from(schema.requests)
    .leftJoin(schema.organizations, eq(schema.requests.organizationId, schema.organizations.id))
    .where(and(eq(schema.requests.userId, userId), not(eq(schema.requests.status, "accepted"))))
    .orderBy(desc(schema.requests.expiresAt));
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
    organizationId: data.tenantId,
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
    filters.push(eq(schema.forms.organizationId, tenantId));
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
  return await db
    .select()
    .from(schema.formFields)
    .where(eq(schema.formFields.formId, formId))
    .orderBy(asc(schema.formFields.orderIndex));
  // const results = await  db
  //   .select()
  //   .from(schema.formFields)
  //   .where(eq(schema.formFields.formId, formId))
  //   .orderBy(asc(schema.formFields.orderIndex));
  //   let i = 0
  //   return results.reduce((acc, val, index) => {
  //     i++;
  //     acc[val.id] = val
  //     acc.length = i;
  //     return acc
  //   }, {length:i})
}

export async function getSubmissionData(db: DrizzleClient, formId: string) {
  const result = await db.query.formFields.findMany({
    where: (formFields, { eq }) => eq(formFields.formId, formId),
    with: {
      fieldSubmissions: {
        with: {
          formSubmission: true,
        },
      },
    },
    orderBy: (formFields, { desc }) => [desc(formFields.formId)],
  });

  return result.map(field => ({
    id: field.id,
    submittedAt: field.createdAt,
    label: field.label,
    fieldSubmissions: field.fieldSubmissions.map(submission => ({
      submissionId: submission.submissionId,
      data: submission.data,
      createdAt: submission.createdAt,
    })),
  }));
}

export async function getSubmissionMetrics(db: DrizzleClient, formId: string) {
  return await db
    .select({
      monthYear: sql<string>`strftime('%Y-%m', datetime(${schema.submissions.createdAt}, 'unixepoch'))`,
      submissionCount: count(),
    })
    .from(schema.submissions)
    .where(eq(schema.submissions.formId, formId))
    .groupBy(
      sql`strftime('%Y-%m', datetime(${schema.submissions.createdAt}, 'unixepoch'))`
    )
    .orderBy(
      sql`strftime('%Y-%m', datetime(${schema.submissions.createdAt}, 'unixepoch')) DESC`
    );
}

/**
 * Get field label by formId and fieldId
 */
export async function getFieldLabel(
  db: DrizzleClient,
  formId: string,
  fieldId: string
) {
  return db
    .select()
    .from(schema.formFields)
    .where(
      eq(schema.formFields.formId, formId) && eq(schema.formFields.id, fieldId)
    );
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
      and(
        eq(schema.forms.id, formId),
        eq(schema.forms.organizationId, tenantId)
      )
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
